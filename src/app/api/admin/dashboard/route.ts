import { NextResponse } from "next/server";

import { mapLoveMessage, mapOrder, mapTableSession } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const [tablesResult, ordersResult, messagesResult] = await Promise.all([
      supabase
        .from("brewboard_table_sessions")
        .select("id,table_number,code,guest_count,is_closed,last_active_at")
        .order("last_active_at", { ascending: false }),
      supabase
        .from("brewboard_orders")
        .select("id,table_session_id,customer_name,customer_avatar_url,items,status,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("brewboard_love_messages")
        .select("id,table_session_id,body,created_at")
        .order("created_at", { ascending: false })
    ]);

    if (tablesResult.error) throw tablesResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (messagesResult.error) throw messagesResult.error;

    return NextResponse.json({
      tables: (tablesResult.data ?? []).map(mapTableSession),
      orders: (ordersResult.data ?? []).map(mapOrder),
      messages: (messagesResult.data ?? []).map(mapLoveMessage)
    });
  } catch (error) {
    console.error("Consolidated dashboard load error:", error);
    return NextResponse.json(
      { error: "Could not load dashboard data.", tables: [], orders: [], messages: [] },
      { status: 500 }
    );
  }
}
