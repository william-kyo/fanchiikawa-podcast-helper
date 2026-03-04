"use client";

import { useEffect, useRef, useCallback } from "react";

interface AudioWaveformProps {
  audioBuffer: AudioBuffer | null
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function AudioWaveform({
  audioBuffer,
  currentTime,
  duration,
  onSeek,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (!audioBuffer) {
      // Draw placeholder bars
      const barWidth = 3;
      const gap = 2;
      const totalBars = Math.floor(width / (barWidth + gap));
      for (let i = 0; i < totalBars; i++) {
        const barHeight = 4 + Math.random() * 16;
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;
        ctx.fillStyle = "oklch(0.91 0 0)";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1);
        ctx.fill();
      }
      return;
    }

    const data = audioBuffer.getChannelData(0);
    const barWidth = 3;
    const gap = 2;
    const totalBars = Math.floor(width / (barWidth + gap));
    const samplesPerBar = Math.floor(data.length / totalBars);
    const progressRatio = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < totalBars; i++) {
      let sum = 0;
      const start = i * samplesPerBar;
      for (let j = start; j < start + samplesPerBar && j < data.length; j++) {
        sum += Math.abs(data[j]);
      }
      const avg = sum / samplesPerBar;
      const barHeight = Math.max(4, avg * height * 0.85);
      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;
      const barRatio = i / totalBars;

      if (barRatio <= progressRatio) {
        ctx.fillStyle = "oklch(0.145 0 0)";
      } else {
        ctx.fillStyle = "oklch(0.87 0 0)";
      }
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1);
      ctx.fill();
    }
  }, [audioBuffer, currentTime, duration]);

  useEffect(() => {
    drawWaveform();
    const handleResize = () => drawWaveform();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawWaveform]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(ratio * duration);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-20 w-full cursor-pointer"
      onClick={handleClick}
      role="slider"
      aria-label="Audio waveform seek bar"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      tabIndex={0}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
