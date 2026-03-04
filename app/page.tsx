"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UploadZone } from "@/components/upload-zone";
import { AudioWaveform } from "@/components/audio-waveform";
import { PlayerControls } from "@/components/player-controls";
import { SearchPanel } from "@/components/search-panel";
import { Headphones, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TranscriptSegment } from "@/app/api/transcribe/route";

interface SearchResult {
  text: string;
  timestamp: number;
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

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const animationRef = useRef<number>(0);

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    animationRef.current = requestAnimationFrame(updateTime);
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
      setIsPlaying(false);
      setCurrentTime(0);
      setSearchResults([]);
      setTranscript([]);

      // Decode audio for waveform
      selectedFile
        .arrayBuffer()
        .then(async (arrayBuffer) => {
          const audioContext = new AudioContext();
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          setAudioBuffer(buffer);
          setDuration(buffer.duration);
        })
        .catch(() => setAudioBuffer(null));

      // Transcribe audio
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("audio", selectedFile);

      fetch("/api/transcribe", { method: "POST", body: formData })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            setTranscript(data.segments ?? []);
          } else {
            toast.error(data.error ?? "Transcription failed");
          }
        })
        .catch(() => toast.error("Transcription failed"))
        .finally(() => setIsTranscribing(false));
    },
    [audioUrl]
  );

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      cancelAnimationFrame(animationRef.current);
    } else {
      audio.play();
      animationRef.current = requestAnimationFrame(updateTime);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, updateTime]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleSkipBack = useCallback(() => {
    handleSeek(Math.max(0, currentTime - 10));
  }, [currentTime, handleSeek]);

  const handleSkipForward = useCallback(() => {
    handleSeek(Math.min(duration, currentTime + 10));
  }, [currentTime, duration, handleSeek]);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      if (!transcript.length) return;

      const lowerQuery = query.toLowerCase();
      const results = transcript
        .filter((seg) => seg.text.toLowerCase().includes(lowerQuery))
        .map((seg) => ({
          text: seg.text.trim(),
          timestamp: seg.start,
        }));

      setSearchResults(results.slice(0, 30));
    },
    [transcript]
  );

  const handleJump = useCallback(
    (timestamp: number) => {
      handleSeek(timestamp);
      if (!isPlaying) {
        handleTogglePlay();
      }
    },
    [handleSeek, isPlaying, handleTogglePlay]
  );

  const handleRemoveFile = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    cancelAnimationFrame(animationRef.current);
    setFile(null);
    setAudioUrl(null);
    setAudioBuffer(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSearchResults([]);
    setTranscript([]);
    setIsTranscribing(false);
  }, [audioUrl]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Headphones className="size-5 text-foreground" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Podcast Helper
          </span>
        </div>
        {file && (
          <div className="flex items-center gap-2">
            <span className="max-w-48 truncate text-xs text-muted-foreground">
              {file.name}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRemoveFile}
              aria-label="Remove audio file"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        {!file ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
                Podcast Playback
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload an audio file to play it back and search through the content
              </p>
            </div>
            <div className="w-full max-w-lg">
              <UploadZone onFileSelect={handleFileSelect} />
            </div>
          </div>
        ) : (
          <>
            {/* Player Card */}
            <Card>
              <CardContent className="flex flex-col gap-5">
                <AudioWaveform
                  audioBuffer={audioBuffer}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={handleSeek}
                />

                <div className="flex items-center justify-between text-xs font-medium tabular-nums text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <PlayerControls
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  onSkipBack={handleSkipBack}
                  onSkipForward={handleSkipForward}
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                  disabled={!audioUrl}
                />
              </CardContent>
            </Card>

            {/* Search Card */}
            <Card>
              <CardContent>
                <SearchPanel
                  results={searchResults}
                  onSearch={handleSearch}
                  onJump={handleJump}
                  disabled={!audioUrl}
                  isTranscribing={isTranscribing}
                  hasTranscript={transcript.length > 0}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            cancelAnimationFrame(animationRef.current);
          }}
          preload="auto"
        />
      )}
    </div>
  );
}
