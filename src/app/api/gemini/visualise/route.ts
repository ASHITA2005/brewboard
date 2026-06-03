import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { visualiseDish } from "@/lib/gemini-menu";

const visualiseSchema = z.object({
  itemName: z.string().min(1),
  description: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = visualiseSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid dish visualisation payload." }, { status: 400 });
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const imageUrl = await visualiseDish(result.data.itemName, result.data.description);
      return NextResponse.json({ imageUrl });
    } catch {
      if (attempt === 1) {
        return NextResponse.json(
          { error: "Feature not possible currently. Please try again later." },
          { status: 503 }
        );
      }
    }
  }

  return NextResponse.json({ error: "Feature not possible currently. Please try again later." }, { status: 503 });
}
