import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { mapTableSession } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.json({ error: "We couldn't find an active table with that code. Please verify the code and try again." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("brewboard_table_sessions")
      .update({ guest_count: existing.guest_count + 1, last_active_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id,table_number,code,guest_count,is_closed,last_active_at")
      .single();

    if (error) throw error;

    try {
      const serverSupabase = await createClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      if (user) {
        await supabase.from("brewboard_user_sessions").upsert({
          user_id: user.id,
          table_session_id: data.id
        });
      }
    } catch (authError) {
      console.error("Failed to associate user session on table join:", authError);
    }

    return NextResponse.json({ table: mapTableSession(data) });
  } catch (err) {
    console.error("Join table error:", err);
    return NextResponse.json({ error: "We encountered an unexpected error. Please try joining again." }, { status: 500 });
  }
}
