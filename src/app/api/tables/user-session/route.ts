import { NextResponse } from "next/server";

import { mapTableSession } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ table: null }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: mapping, error: mappingError } = await adminSupabase
      .from("brewboard_user_sessions")
      .select("table_session_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (mappingError) {
      throw mappingError;
    }

    if (mapping?.table_session_id) {
      const { data: session, error: sessionError } = await adminSupabase
        .from("brewboard_table_sessions")
        .select("id,table_number,code,guest_count,is_closed,last_active_at")
        .eq("id", mapping.table_session_id)
        .single();

      if (sessionError) {
        throw sessionError;
      }

      if (session && !session.is_closed) {
        return NextResponse.json({ table: mapTableSession(session) });
      }
    }

    return NextResponse.json({ table: null });
  } catch (err) {
    console.error("Failed to retrieve user active table session:", err);
    return NextResponse.json({ error: "Could not fetch session info." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { error: deleteError } = await adminSupabase
      .from("brewboard_user_sessions")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete user active table session:", err);
    return NextResponse.json({ error: "Could not leave table session." }, { status: 500 });
  }
}
