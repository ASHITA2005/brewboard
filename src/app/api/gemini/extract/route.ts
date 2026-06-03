import { NextResponse } from "next/server";
import { z } from "zod";

import { extractMenuFromImage } from "@/lib/gemini-menu";
import { parsedMenuDraft } from "@/lib/sample-data";

const extractSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().min(1).default("image/jpeg")
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = extractSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid menu image payload." }, { status: 400 });
  }

  try {
    const payload = await extractMenuFromImage(result.data.imageBase64, result.data.mimeType);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Menu extraction failed.";

    if (!process.env.GOOGLE_GENAI_API_KEY) {
      return NextResponse.json({
        items: parsedMenuDraft,
        passes: { first: "complete", second: "complete" },
        fallback: true
      });
    }

    return NextResponse.json(
      { error: message.includes("GOOGLE_GENAI") ? "Menu extraction is not configured." : message },
      { status: 503 }
    );
  }
}
