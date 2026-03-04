"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-16 transition-colors ${
        isDragging
          ? "border-foreground/30 bg-accent"
          : "border-border hover:border-foreground/20 hover:bg-accent/50"
      }`}
      role="button"
      tabIndex={0}
      aria-label="Upload audio file"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <Upload className="size-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-foreground">
          Drop your audio file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supports MP3, WAV, OGG, M4A, and FLAC
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
}
