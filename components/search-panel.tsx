"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, Loader2, Mic, MicOff } from "lucide-react";
import { DictionaryPanel } from "@/components/dictionary-panel";

interface SearchResult {
  text: string;
  timestamp: number;
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface SearchPanelProps {
  results: SearchResult[];
  onSearch: (query: string) => void;
  onJump: (timestamp: number) => void;
  disabled: boolean;
  isTranscribing: boolean;
  hasTranscript: boolean;
  transcript: TranscriptSegment[];
  currentTime: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-800">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function SearchPanel({
  results,
  onSearch,
  onJump,
  disabled,
  isTranscribing,
  hasTranscript,
  transcript,
  currentTime,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [speechSupported, setSpeechSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Dictionary state
  const [lookupWord, setLookupWord] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  // Extract ~60s of context around current playback position
  const getContext = useCallback(() => {
    if (!transcript.length) return undefined;
    const nearby = transcript
      .filter((seg) => Math.abs(seg.start - currentTime) < 30)
      .map((seg) => seg.text.trim())
      .join(" ");
    return nearby || undefined;
  }, [transcript, currentTime]);

  const handleLookup = useCallback(
    async (word: string) => {
      if (!word.trim()) return;
      setLookupWord(word);
      setExplanation(null);
      setIsLookingUp(true);

      try {
        const res = await fetch("/api/dictionary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word, context: getContext() }),
        });
        const data = await res.json();
        setExplanation(res.ok ? (data.explanation ?? "") : "Lookup failed.");
      } catch {
        setExplanation("Lookup failed.");
      } finally {
        setIsLookingUp(false);
      }
    },
    [getContext]
  );

  // Detect text selection in results and trigger lookup
  const handleResultsMouseUp = useCallback(() => {
    const selected = window.getSelection()?.toString().trim();
    if (selected && selected.length >= 1 && selected.length <= 50) {
      handleLookup(selected);
    }
  }, [handleLookup]);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechRecognitionAPI();
    recognition.maxAlternatives = 5;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setAlternatives([]);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const alts: string[] = [];
      for (let i = 0; i < result.length; i++) {
        const t = result[i].transcript.trim();
        if (t && !alts.includes(t)) alts.push(t);
      }
      setAlternatives(alts);
      if (alts[0]) setQuery(alts[0]);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSelectAlternative = (alt: string) => {
    setQuery(alt);
    setAlternatives([]);
    setActiveQuery(alt);
    onSearch(alt);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      setAlternatives([]);
      setActiveQuery(query.trim());
      onSearch(query.trim());
    }
  };

  const searchDisabled = disabled || isTranscribing || !hasTranscript;

  const placeholder = isTranscribing
    ? "Transcribing audio..."
    : hasTranscript
      ? "Search transcript to jump to position..."
      : "Waiting for transcript...";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAlternatives([]);
            }}
            className="pl-9"
            disabled={searchDisabled}
            aria-label="Search transcript"
          />
        </div>

        {speechSupported && (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleMicClick}
            disabled={searchDisabled}
            aria-label={isListening ? "Stop listening" : "Search by voice"}
            title={isListening ? "Stop" : "Voice search"}
          >
            {isListening ? (
              <MicOff className="size-4 animate-pulse" />
            ) : (
              <Mic className="size-4" />
            )}
          </Button>
        )}

        <Button type="submit" disabled={searchDisabled || !query.trim()}>
          Search
        </Button>
      </form>

      {isListening && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          Listening... speak now
        </div>
      )}

      {alternatives.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Select a candidate:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {alternatives.map((alt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectAlternative(alt)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors hover:bg-accent ${
                  i === 0
                    ? "border-foreground/30 bg-secondary font-medium"
                    : "border-border text-muted-foreground"
                }`}
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}

      {isTranscribing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Transcribing audio, please wait...
        </div>
      )}

      {!isTranscribing && activeQuery && results.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No results found for &ldquo;{activeQuery}&rdquo;
        </p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""} found
              for &ldquo;{activeQuery}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground/60">
              Select text to look up
            </p>
          </div>
          {/* onMouseUp detects text selection for dictionary lookup */}
          <ul
            className="flex max-h-64 flex-col gap-1 overflow-y-auto"
            role="list"
            onMouseUp={handleResultsMouseUp}
          >
            {results.map((result, i) => (
              <li key={i}>
                <button
                  onClick={() => onJump(result.timestamp)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  aria-label={`Jump to ${formatTime(result.timestamp)}`}
                >
                  <span className="flex shrink-0 items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    <Clock className="size-3" />
                    {formatTime(result.timestamp)}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">
                    <HighlightedText text={result.text} query={activeQuery} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dictionary Panel */}
      {lookupWord && (
        <DictionaryPanel
          word={lookupWord}
          explanation={explanation}
          isLoading={isLookingUp}
          onClose={() => {
            setLookupWord("");
            setExplanation(null);
          }}
        />
      )}
    </div>
  );
}
