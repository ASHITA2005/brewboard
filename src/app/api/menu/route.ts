import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { mapMenuItem } from "@/lib/brewboard-mappers";
import { menuItems } from "@/lib/sample-data";
import { createAdminClient } from "@/lib/supabase/admin";

const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(""),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  accent: z.enum(["caramel", "mint", "sky", "blush", "lavender"]).default("caramel")
});

const publishSchema = z.object({
  items: z.array(menuItemSchema).min(1)
});

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brewboard_menu_items")
      .select("id,name,description,price,category,image_url,accent")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ items: (data ?? []).map(mapMenuItem) });
  } catch {
    return NextResponse.json({ items: menuItems });
  }
}

export async function POST(request: Request) {
  const payload = publishSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid menu payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error: deactivateError } = await supabase
      .from("brewboard_menu_items")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) throw deactivateError;

    const rows = payload.data.items.map((item, index) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.imageUrl || null,
      accent: item.accent,
      is_active: true,
      sort_order: index + 1
    }));

    const { data, error } = await supabase
      .from("brewboard_menu_items")
      .insert(rows)
      .select("id,name,description,price,category,image_url,accent")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ items: (data ?? []).map(mapMenuItem) });
  } catch {
    return NextResponse.json({ error: "Could not publish the menu right now." }, { status: 500 });
  }
}
