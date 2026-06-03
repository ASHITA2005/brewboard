import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { mapTableSession } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

const joinSchema = z.object({
  code: z.string().length(6)
});

export async function POST(request: Request) {
  const payload = joinSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Use a valid 6-character table code." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: findError } = await supabase
      .from("brewboard_table_sessions")
      .select("id,table_number,code,guest_count,is_closed,last_active_at")
      .eq("code", payload.data.code.toUpperCase())
      .single();

    if (findError || !existing || existing.is_closed) {
      return NextResponse.json({ error: "That table code is invalid or closed." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("brewboard_table_sessions")
      .update({ guest_count: existing.guest_count + 1, last_active_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id,table_number,code,guest_count,is_closed,last_active_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ table: mapTableSession(data) });
  } catch {
    return NextResponse.json({ error: "Could not join this table." }, { status: 500 });
  }
}
