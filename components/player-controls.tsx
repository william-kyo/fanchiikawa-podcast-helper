"use client";

import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PlayerControlsProps {
  isPlaying: boolean
  onTogglePlay: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  volume: number
  onVolumeChange: (value: number) => void
  disabled: boolean
}

export function PlayerControls({
  isPlaying,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  volume,
  onVolumeChange,
  disabled,
}: PlayerControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipBack}
          disabled={disabled}
          aria-label="Skip back 10 seconds"
        >
          <RotateCcw className="size-4" />
        </Button>

        <Button
          variant="default"
          size="icon-lg"
          onClick={onTogglePlay}
          disabled={disabled}
          className="rounded-full"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="ml-0.5 size-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipForward}
          disabled={disabled}
          aria-label="Skip forward 10 seconds"
        >
          <RotateCw className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
          disabled={disabled}
          aria-label={volume === 0 ? "Unmute" : "Mute"}
        >
          {volume === 0 ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </Button>
        <Slider
          value={[volume]}
          max={1}
          step={0.01}
          onValueChange={([v]) => onVolumeChange(v)}
          className="w-24"
          disabled={disabled}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
