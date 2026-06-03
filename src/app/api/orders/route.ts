import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { mapOrder } from "@/lib/brewboard-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

const itemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative()
});

const orderSchema = z.object({
  tableSessionId: z.string().uuid(),
  customerName: z.string().min(1).default("Guest"),
  customerAvatarUrl: z.string().url().optional(),
  items: z.array(itemSchema).min(1)
});

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["received", "preparing", "ready", "complete"])
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tableSessionId = url.searchParams.get("tableSessionId");

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("brewboard_orders")
      .select("id,table_session_id,customer_name,customer_avatar_url,items,status,created_at")
      .order("created_at", { ascending: false });

    if (tableSessionId) {
      query = query.eq("table_session_id", tableSessionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ orders: (data ?? []).map(mapOrder) });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}

export async function POST(request: Request) {
  const payload = orderSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Your cart needs at least one valid item." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Verify if table session is open
    const { data: tableSession, error: sessionError } = await supabase
      .from("brewboard_table_sessions")
      .select("is_closed")
      .eq("id", payload.data.tableSessionId)
      .single();

    if (sessionError || !tableSession) {
      return NextResponse.json({ error: "Table session not found." }, { status: 404 });
    }

    if (tableSession.is_closed) {
      return NextResponse.json({ error: "This table session has been closed by the café staff." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("brewboard_orders")
      .insert({
        table_session_id: payload.data.tableSessionId,
        customer_name: payload.data.customerName,
        items: payload.data.items,
        status: "received"
      })
      .select("id,table_session_id,customer_name,customer_avatar_url,items,status,created_at")
      .single();


    if (error) throw error;

    await supabase
      .from("brewboard_table_sessions")
      .update({ last_active_at: now })
      .eq("id", payload.data.tableSessionId);

    return NextResponse.json({ order: mapOrder(data) });
  } catch {
    return NextResponse.json({ error: "Could not place your order." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const payload = statusSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid order status update." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brewboard_orders")
      .update({
        status: payload.data.status,
        completed_at: payload.data.status === "complete" ? new Date().toISOString() : null
      })
      .eq("id", payload.data.id)
      .select("id,table_session_id,customer_name,customer_avatar_url,items,status,created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ order: mapOrder(data) });
  } catch {
    return NextResponse.json({ error: "Could not update the order status." }, { status: 500 });
  }
}
