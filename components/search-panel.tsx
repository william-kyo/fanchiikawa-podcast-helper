"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, Loader2 } from "lucide-react";

interface SearchResult {
  text: string;
  timestamp: number;
}

interface SearchPanelProps {
  results: SearchResult[];
  onSearch: (query: string) => void;
  onJump: (timestamp: number) => void;
  disabled: boolean;
  isTranscribing: boolean;
  hasTranscript: boolean;
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
          <mark
            key={i}
            className="rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-800"
          >
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
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
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
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            disabled={searchDisabled}
            aria-label="Search transcript"
          />
        </div>
        <Button type="submit" disabled={searchDisabled || !query.trim()}>
          Search
        </Button>
      </form>

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
          <p className="text-xs font-medium text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} found for &ldquo;{activeQuery}&rdquo;
          </p>
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto" role="list">
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
    </div>
  );
}
