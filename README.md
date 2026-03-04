# Fanchiikawa Podcast Helper

A browser-based podcast player built with Next.js. Upload a local audio file, visualize the waveform, control playback, and search through audio content.

## Features

- Drag-and-drop or click-to-upload audio files (MP3, WAV, M4A, etc.)
- Waveform visualization with click-to-seek
- Playback controls: play/pause, skip ±10 seconds, volume
- Content search panel with timestamp jumping

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS v4, shadcn/ui, Radix UI
- **Language**: TypeScript

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/) (recommended — the project ships a `pnpm-lock.yaml`)

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd fanchiikawa-podcast-helper
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Other Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server (run `build` first) |
| `pnpm lint` | Run ESLint |

## Project Structure

```
fanchiikawa-podcast-helper/
├── app/                  # Next.js App Router (pages, layout, global styles)
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── audio-waveform.tsx
│   ├── player-controls.tsx
│   ├── search-panel.tsx
│   └── upload-zone.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── styles/               # Additional global styles
```
