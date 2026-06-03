import { NextResponse } from "next/server";

import { mapLoveMessage, mapOrder } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tableSessionId = url.searchParams.get("tableSessionId");

  if (!tableSessionId) {
    return NextResponse.json({ error: "Missing tableSessionId param.", orders: [], messages: [] }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Prune completed orders older than 3 days
    await supabase
      .from("brewboard_orders")
      .delete()
      .eq("status", "complete")
      .lt("completed_at", threeDaysAgo.toISOString());

    const [sessionResult, ordersResult, messagesResult] = await Promise.all([
      supabase
        .from("brewboard_table_sessions")
        .select("is_closed")
        .eq("id", tableSessionId)
        .single(),
      supabase
        .from("brewboard_orders")
        .select("id,table_session_id,customer_name,customer_avatar_url,items,status,created_at")
        .eq("table_session_id", tableSessionId)
        .order("created_at", { ascending: false }),
      supabase
        .from("brewboard_love_messages")
        .select("id,table_session_id,body,created_at")
        .eq("table_session_id", tableSessionId)
        .order("created_at", { ascending: false })
    ]);

    // Handle session not found or closed
    if (sessionResult.error) {
      throw sessionResult.error;
    }

    const isClosed = sessionResult.data?.is_closed ?? false;

    return NextResponse.json({
      isClosed,
      orders: (ordersResult.data ?? []).map(mapOrder),
      messages: (messagesResult.data ?? []).map(mapLoveMessage)
    });
  } catch (error) {
    console.error("Consolidated table feed load error:", error);
    return NextResponse.json(
      { error: "Could not load table feed data.", orders: [], messages: [] },
      { status: 500 }
    );
  }
}
