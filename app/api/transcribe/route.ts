import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "File too large. Maximum size is 25MB. Please compress your audio first.",
        },
        { status: 413 },
      );
    }

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const segments: TranscriptSegment[] = (
      (transcription as any).segments ?? []
    ).map((seg: { start: number; end: number; text: string }) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    }));

    return NextResponse.json({ segments });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 },
    );
  }
}
