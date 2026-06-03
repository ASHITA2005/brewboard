import { getGeminiClient } from "@/lib/gemini";
import type { ParsedMenuItem } from "@/types/brewboard";

const accents = ["caramel", "mint", "sky", "blush", "lavender"] as const;

type ExtractedItem = {
  name: string;
  description: string;
  price: number;
  category: string;
};

type ExtractedMenu = {
  items: ExtractedItem[];
};

const menuPrompt = `You are extracting a café menu from a photo.
Return ONLY valid JSON with this shape:
{"items":[{"name":"string","description":"string","price":number,"category":"string"}]}
Prices must be numbers in the café's local currency without symbols.
Use concise descriptions. Categories should be short (Coffee, Tea, Food, Desserts, Bakes).`;

function parseMenuJson(raw: string): ExtractedMenu {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as ExtractedMenu;

  if (!Array.isArray(parsed.items)) {
    throw new Error("Gemini returned an invalid menu shape.");
  }

  return parsed;
}

async function runMenuPass(imageBase64: string, mimeType: string) {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: menuPrompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini did not return menu text.");
  }

  return parseMenuJson(text);
}

function reconcileMenus(first: ExtractedMenu, second: ExtractedMenu): ParsedMenuItem[] {
  const secondByKey = new Map(
    second.items.map((item) => [`${item.name.toLowerCase()}|${item.category.toLowerCase()}`, item])
  );

  const merged = first.items.map((item, index) => {
    const key = `${item.name.toLowerCase()}|${item.category.toLowerCase()}`;
    const match = secondByKey.get(key);
    const flagged =
      !match ||
      Math.abs(match.price - item.price) > 1 ||
      match.description.trim().toLowerCase() !== item.description.trim().toLowerCase();

    return {
      id: `draft-${index}-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      accent: accents[index % accents.length],
      flagged
    };
  });

  for (const item of second.items) {
    const key = `${item.name.toLowerCase()}|${item.category.toLowerCase()}`;
    const exists = merged.some(
      (entry) => `${entry.name.toLowerCase()}|${entry.category.toLowerCase()}` === key
    );

    if (!exists) {
      merged.push({
        id: `draft-flagged-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        accent: "lavender",
        flagged: true
      });
    }
  }

  return merged;
}

export async function extractMenuFromImage(imageBase64: string, mimeType: string) {
  let firstPass: ExtractedMenu | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      firstPass = await runMenuPass(imageBase64, mimeType);
      break;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  if (!firstPass) {
    throw new Error("Menu extraction failed.");
  }

  let secondPass: ExtractedMenu | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      secondPass = await runMenuPass(imageBase64, mimeType);
      break;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  if (!secondPass) {
    throw new Error("Menu verification pass failed.");
  }

  return {
    items: reconcileMenus(firstPass, secondPass),
    passes: {
      first: "complete" as const,
      second: "complete" as const
    }
  };
}

export async function visualiseDish(itemName: string, description: string) {
  const client = getGeminiClient();
  const response = await client.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt: `Create a photorealistic café food photo of "${itemName}". ${description}. Warm natural lighting, shallow depth of field, no text or watermark.`,
    config: {
      numberOfImages: 1,
      outputMimeType: "image/jpeg"
    }
  });

  const generatedImage = response.generatedImages?.[0];
  if (generatedImage?.image?.imageBytes) {
    const mimeType = "image/jpeg";
    return `data:${mimeType};base64,${generatedImage.image.imageBytes}`;
  }

  throw new Error("Gemini did not return an image.");
}
