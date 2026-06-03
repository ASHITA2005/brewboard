import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { mapLoveMessage } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

const messageSchema = z.object({
  tableSessionId: z.string().uuid(),
  body: z.string().min(1).max(200)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tableSessionId = url.searchParams.get("tableSessionId");

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("brewboard_love_messages")
      .select("id,table_session_id,body,created_at")
      .order("created_at", { ascending: false });

    if (tableSessionId) {
      query = query.eq("table_session_id", tableSessionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ messages: (data ?? []).map(mapLoveMessage) });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: Request) {
  const payload = messageSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Messages must be 1-200 characters." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brewboard_love_messages")
      .insert({
        table_session_id: payload.data.tableSessionId,
        body: payload.data.body
      })
      .select("id,table_session_id,body,created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ message: mapLoveMessage(data) });
  } catch {
    return NextResponse.json({ error: "Could not send this message." }, { status: 500 });
  }
}
