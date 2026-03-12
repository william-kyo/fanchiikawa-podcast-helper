"use client";

import { useState } from "react";
import { Volume2, Loader2, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DictionaryPanelProps {
  word: string;
  explanation: string | null;
  isLoading: boolean;
  onClose: () => void;
}

function detectLang(text: string): string {
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return "ja-JP";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN";
  return "en-US";
}

export function DictionaryPanel({
  word,
  explanation,
  isLoading,
  onClose,
}: DictionaryPanelProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!explanation || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(explanation);
    utterance.lang = detectLang(explanation);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Dictionary</span>
          <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {word}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close dictionary"
        >
          <X className="size-3" />
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Looking up...
        </div>
      )}

      {!isLoading && explanation && (
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm leading-relaxed text-foreground">
            {explanation}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleSpeak}
            disabled={isSpeaking}
            aria-label="Read aloud"
            title="Read aloud"
          >
            <Volume2
              className={`size-3.5 ${isSpeaking ? "animate-pulse text-primary" : ""}`}
            />
          </Button>
        </div>
      )}
    </div>
  );
}
