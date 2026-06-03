import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { mapTableSession } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTableCode } from "@/lib/utils";

const createSchema = z.object({
  tableNumber: z.string().min(1),
  ownerName: z.string().min(1).default("Guest")
});

const closeSchema = z.object({
  id: z.string().uuid()
});

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brewboard_table_sessions")
      .select("id,table_number,code,guest_count,is_closed,last_active_at")
      .order("last_active_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ tables: (data ?? []).map(mapTableSession) });
  } catch {
    return NextResponse.json({ tables: [] });
  }
}

export async function POST(request: Request) {
  const payload = createSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid table number." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await supabase
        .from("brewboard_table_sessions")
        .insert({
          table_number: payload.data.tableNumber,
          owner_name: payload.data.ownerName,
          code: generateTableCode(),
          guest_count: 1
        })
        .select("id,table_number,code,guest_count,is_closed,last_active_at")
        .single();

      if (!error && data) {
        return NextResponse.json({ table: mapTableSession(data) });
      }

      lastError = error;
    }

    throw lastError;
  } catch {
    return NextResponse.json({ error: "Could not create a table session." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const payload = closeSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid table session." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brewboard_table_sessions")
      .update({ is_closed: true, closed_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
      .eq("id", payload.data.id)
      .select("id,table_number,code,guest_count,is_closed,last_active_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ table: mapTableSession(data) });
  } catch {
    return NextResponse.json({ error: "Could not close this table." }, { status: 500 });
  }
}
