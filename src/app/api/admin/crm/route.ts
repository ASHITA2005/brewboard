import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getOrderTotal(order: any) {
  if (!order.items || !Array.isArray(order.items)) return 0;
  return order.items.reduce((sum: number, item: any) => sum + (Number(item.price ?? 0) * Number(item.quantity ?? 0)), 0);
}

function toIstDate(dateStr: string) {
  const utcDate = new Date(dateStr);
  return new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
}

const eod = (d: string) => `${d}T23:59:59.999Z`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!start_date || !end_date) {
      return NextResponse.json({ error: "Missing start_date or end_date parameters." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const [ordersResult, sessionsResult, menuItemsResult, messagesResult] = await Promise.all([
      supabase
        .from("brewboard_orders")
        .select("created_at, completed_at, items, status, table_session_id")
        .gte("created_at", start_date)
        .lte("created_at", eod(end_date)),
      supabase
        .from("brewboard_table_sessions")
        .select("id, table_number, created_at, closed_at, is_closed")
        .gte("created_at", start_date)
        .lte("created_at", eod(end_date)),
      supabase
        .from("brewboard_menu_items")
        .select("name, category"),
      supabase
        .from("crm_messages")
        .select("id, user_id, channel, subject, body, sent_at, triggered_by, profiles(full_name, email, avatar_url)")
        .order("sent_at", { ascending: false })
        .limit(50)
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (sessionsResult.error) throw sessionsResult.error;
    if (menuItemsResult.error) throw menuItemsResult.error;
    if (messagesResult.error) throw messagesResult.error;

    const orders = ordersResult.data ?? [];
    const sessions = sessionsResult.data ?? [];
    const menuItems = menuItemsResult.data ?? [];
    const messages = messagesResult.data ?? [];

    // 1. Revenue Summary
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'complete');
    const totalRevenue = completedOrders.reduce((s, o) => s + getOrderTotal(o), 0);
    const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

    const revenueSummary = {
      total_orders: totalOrders,
      completed_orders: completedOrders.length,
      pending_orders: totalOrders - completedOrders.length,
      total_revenue_inr: Math.round(totalRevenue * 100) / 100,
      average_order_value_inr: Math.round(aov * 100) / 100,
      completion_rate_pct: Math.round(completionRate * 100) / 100
    };

    // 2. Peak Hours (IST)
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      order_count: 0,
      revenue_inr: 0,
    }));
    for (const order of orders) {
      const istDate = toIstDate(order.created_at);
      const istHour = istDate.getUTCHours();
      hours[istHour].order_count++;
      if (order.status === 'complete') {
        hours[istHour].revenue_inr += getOrderTotal(order);
      }
    }
    hours.forEach(h => { h.revenue_inr = Math.round(h.revenue_inr * 100) / 100 });

    // 3. Orders by Table
    const sessionMap: Record<string, string> = {};
    sessions.forEach(s => { sessionMap[s.id] = s.table_number; });

    const missingSessionIds = Array.from(new Set(orders.map(o => o.table_session_id).filter(id => id && !sessionMap[id])));
    if (missingSessionIds.length > 0) {
      const { data: extraSessions } = await supabase
        .from("brewboard_table_sessions")
        .select("id, table_number")
        .in("id", missingSessionIds);
      extraSessions?.forEach(s => { sessionMap[s.id] = s.table_number; });
    }

    const byTable: Record<string, { table_number: string; order_count: number; revenue_inr: number }> = {};
    for (const order of orders) {
      const num = sessionMap[order.table_session_id] ?? 'unknown';
      if (!byTable[num]) byTable[num] = { table_number: num, order_count: 0, revenue_inr: 0 };
      byTable[num].order_count++;
      if (order.status === 'complete') {
        byTable[num].revenue_inr += getOrderTotal(order);
      }
    }
    const ordersByTable = Object.values(byTable)
      .map(r => ({ ...r, revenue_inr: Math.round(r.revenue_inr * 100) / 100 }))
      .sort((a, b) => b.revenue_inr - a.revenue_inr);

    // 4. Most Ordered Items
    const categoryMap: Record<string, string> = {};
    menuItems.forEach(item => { categoryMap[item.name] = item.category; });

    const byItem: Record<string, { name: string; category: string; total_quantity: number; total_revenue_inr: number }> = {};
    for (const order of orders) {
      if (!order.items || !Array.isArray(order.items)) continue;
      for (const item of order.items) {
        const name = item.name ?? 'unknown';
        const cat = categoryMap[name] ?? 'unknown';
        const qty = Number(item.quantity ?? 0);
        const price = Number(item.price ?? 0);

        if (!byItem[name]) {
          byItem[name] = { name, category: cat, total_quantity: 0, total_revenue_inr: 0 };
        }
        byItem[name].total_quantity += qty;
        if (order.status === 'complete') {
          byItem[name].total_revenue_inr += qty * price;
        }
      }
    }
    const mostOrderedItems = Object.values(byItem)
      .map(r => ({ ...r, total_revenue_inr: Math.round(r.total_revenue_inr * 100) / 100 }))
      .sort((a, b) => b.total_quantity - a.total_quantity);

    // 5. Busiest Days
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const days = dayNames.map(name => ({ day: name, order_count: 0, revenue_inr: 0 }));
    for (const order of orders) {
      const istDate = toIstDate(order.created_at);
      const dow = istDate.getUTCDay();
      days[dow].order_count++;
      if (order.status === 'complete') {
        days[dow].revenue_inr += getOrderTotal(order);
      }
    }
    days.forEach(d => { d.revenue_inr = Math.round(d.revenue_inr * 100) / 100 });

    // 6. Table Turnover
    const closedSessions = sessions.filter(s => s.is_closed && s.closed_at);
    const turnoverByTable: Record<string, { table_number: string; session_count: number; total_minutes: number }> = {};
    for (const session of closedSessions) {
      const num = session.table_number ?? 'unknown';
      const duration = (new Date(session.closed_at!).getTime() - new Date(session.created_at).getTime()) / 60000;
      if (!turnoverByTable[num]) turnoverByTable[num] = { table_number: num, session_count: 0, total_minutes: 0 };
      turnoverByTable[num].session_count++;
      turnoverByTable[num].total_minutes += duration;
    }
    const tableTurnover = Object.values(turnoverByTable).map(r => ({
      table_number: r.table_number,
      session_count: r.session_count,
      avg_duration_minutes: Math.round((r.total_minutes / r.session_count) * 10) / 10,
    })).sort((a, b) => b.avg_duration_minutes - a.avg_duration_minutes);

    const allDurations = closedSessions.map(s => (new Date(s.closed_at!).getTime() - new Date(s.created_at).getTime()) / 60000);
    const globalAvgTurnoverMinutes = allDurations.length > 0 ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length : 0;

    // 7. Average Order Value (AOV) Daily Trend
    const byDay: Record<string, { date: string; order_count: number; total_revenue: number }> = {};
    for (const order of completedOrders) {
      const istDate = toIstDate(order.created_at);
      const day = istDate.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, order_count: 0, total_revenue: 0 };
      byDay[day].order_count++;
      byDay[day].total_revenue += getOrderTotal(order);
    }
    const aovDailyTrend = Object.values(byDay).map(d => ({
      date: d.date,
      order_count: d.order_count,
      total_revenue_inr: Math.round(d.total_revenue * 100) / 100,
      aov_inr: Math.round((d.total_revenue / d.order_count) * 100) / 100,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 8. Order Completion Time
    const completedOrdersWithTime = completedOrders.filter(o => o.completed_at);
    let kitchenMetrics = {
      completed_orders: completedOrdersWithTime.length,
      avg_minutes: 0,
      median_minutes: 0,
      p90_minutes: 0,
      fastest_minutes: 0,
      slowest_minutes: 0
    };
    if (completedOrdersWithTime.length > 0) {
      const durations = completedOrdersWithTime.map(o => (new Date(o.completed_at!).getTime() - new Date(o.created_at).getTime()) / 60000);
      durations.sort((a, b) => a - b);
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const median = durations[Math.floor(durations.length / 2)];
      const p90 = durations[Math.floor(durations.length * 0.9)];
      kitchenMetrics = {
        completed_orders: completedOrdersWithTime.length,
        avg_minutes: Math.round(avg * 10) / 10,
        median_minutes: Math.round(median * 10) / 10,
        p90_minutes: Math.round(p90 * 10) / 10,
        fastest_minutes: Math.round(durations[0] * 10) / 10,
        slowest_minutes: Math.round(durations[durations.length - 1] * 10) / 10
      };
    }

    // 9. Outreach History with profile info joined
    const outreachHistory = messages.map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      channel: m.channel,
      subject: m.subject,
      body: m.body,
      sent_at: m.sent_at,
      triggered_by: m.triggered_by,
      recipient: m.profiles ? {
        full_name: m.profiles.full_name,
        email: m.profiles.email,
        avatar_url: m.profiles.avatar_url
      } : null
    }));

    return NextResponse.json({
      revenue_summary: revenueSummary,
      peak_hours: hours,
      orders_by_table: ordersByTable,
      most_ordered_items: mostOrderedItems,
      busiest_days: days,
      table_turnover: {
        global_avg_minutes: Math.round(globalAvgTurnoverMinutes * 10) / 10,
        by_table: tableTurnover
      },
      aov_daily_trend: aovDailyTrend,
      kitchen_performance: kitchenMetrics,
      outreach_history: outreachHistory
    });

  } catch (error: any) {
    console.error("CRM Dashboard GET error:", error);
    return NextResponse.json({ error: error.message || "Could not load CRM data." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { table_number, visit_date, message_body, subject } = await request.json().catch(() => ({}));

    if (!table_number || !visit_date || !message_body) {
      return NextResponse.json({ error: "Missing table_number, visit_date, or message_body in request." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Step 1: Find the most recent closed session for this table on this date
    const dayStart = `${visit_date}T00:00:00.000Z`;
    const dayEnd = `${visit_date}T23:59:59.999Z`;

    const { data: sessions, error: sessionError } = await supabase
      .from("brewboard_table_sessions")
      .select("id, created_at, closed_at")
      .eq("table_number", table_number)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .eq("is_closed", true)
      .not("closed_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessionError) throw sessionError;

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        status: "not_found",
        message: `No closed session found for table ${table_number} on ${visit_date}. The session may still be open or may not exist.`
      }, { status: 404 });
    }

    const session = sessions[0];

    // Step 2: Find one user who was part of this session using brewboard_user_sessions
    const { data: userSessions, error: userSessionError } = await supabase
      .from("brewboard_user_sessions")
      .select("user_id")
      .eq("table_session_id", session.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (userSessionError) throw userSessionError;

    let userId = null;
    if (userSessions && userSessions.length > 0) {
      userId = userSessions[0].user_id;
    } else {
      return NextResponse.json({
        status: "no_user",
        message: `Session found for table ${table_number} on ${visit_date} but no user registration was found in brewboard_user_sessions. Cannot send message.`
      }, { status: 400 });
    }

    // Step 3: Insert into crm_messages
    const { data: msg, error: insertError } = await supabase
      .from("crm_messages")
      .insert({
        user_id: userId,
        channel: "simulated",
        subject: subject || null,
        body: message_body,
        triggered_by: "admin-crm-dashboard"
      })
      .select("id, sent_at")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      status: "simulated",
      message_id: msg.id,
      sent_at: msg.sent_at,
      table_number,
      visit_date,
      channel: "simulated",
      note: "Message recorded in outreach history."
    });

  } catch (error: any) {
    console.error("CRM Outreach POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch outreach message." }, { status: 500 });
  }
}
