import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { word, context } = (await req.json()) as {
      word: string;
      context?: string;
    };

    if (!word?.trim()) {
      return NextResponse.json({ error: "No word provided" }, { status: 400 });
    }

    const userMessage = context
      ? `Word or phrase to look up: "${word}"\n\nContext from the podcast currently being listened to:\n"${context}"`
      : `Word or phrase to look up: "${word}"`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a concise language dictionary assistant.

Rules:
1. Detect the language of the given word/phrase.
2. Explain it simply in that SAME language — do NOT translate to another language.
3. If podcast context is provided, briefly mention how the word is used there.
4. Keep your response to 2–3 sentences. No preamble, no title, just the explanation.`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 150,
      temperature: 0.2,
    });

    const explanation = completion.choices[0].message.content ?? "";
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Dictionary error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
