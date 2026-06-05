import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import dns from "dns";

export const dynamic = "force-dynamic";

// Custom DNS Resolver fallback for local development where *.up.railway.app may fail to resolve
const originalLookup = dns.lookup;
const resolver = new dns.Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

dns.lookup = function (
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: string | any[], family?: number) => void
) {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "object" ? options : {};

  originalLookup(hostname, options, (err, address, family) => {
    if (err && hostname === "crmmcp-production-3555.up.railway.app") {
      resolver.resolve4(hostname, (resolveErr, addresses) => {
        if (resolveErr || !addresses || addresses.length === 0) {
          cb(err, address, family);
        } else {
          const ip = addresses[0];
          if (opts.all) {
            cb(null, [{ address: ip, family: 4 }]);
          } else {
            cb(null, ip, 4);
          }
        }
      });
    } else {
      cb(err, address, family);
    }
  });
} as any;

const mcpUrl = "https://crmmcp-production-3555.up.railway.app";
const apiKey = "test_mcp_api_key_for_brewboard_crm_server";

async function callMcpToolsMultiplexed(
  tools: Array<{ key: string; name: string; args: Record<string, any> }>
): Promise<Record<string, any>> {
  // 1. Connect to SSE
  const sseResponse = await fetch(`${mcpUrl}/sse`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "text/event-stream"
    }
  });

  if (!sseResponse.ok) {
    throw new Error(`Failed to connect to MCP server SSE: ${sseResponse.status} ${sseResponse.statusText}`);
  }

  const reader = sseResponse.body?.getReader();
  if (!reader) {
    throw new Error("No body reader on SSE response");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  const results: Record<string, any> = {};
  const pendingRequests = new Map<number, { key: string; name: string }>();

  let idCounter = 1;
  const requestIdToKey: Record<number, string> = {};
  tools.forEach(t => {
    requestIdToKey[idCounter] = t.key;
    pendingRequests.set(idCounter, { key: t.key, name: t.name });
    idCounter++;
  });

  return new Promise((resolve, reject) => {
    let completed = false;

    const cleanup = () => {
      completed = true;
      try {
        reader.releaseLock();
      } catch (e) {}
      try {
        sseResponse.body?.cancel();
      } catch (e) {}
    };

    // Timeout to prevent hanging forever
    const timeout = setTimeout(() => {
      if (!completed) {
        cleanup();
        reject(new Error(`Timeout waiting for tools: ${Array.from(pendingRequests.values()).map(r => r.name).join(", ")}`));
      }
    }, 15000);

    let currentEvent = "";

    const read = async () => {
      try {
        while (!completed) {
          const { value, done } = await reader.read();
          if (done) {
            if (!completed) {
              cleanup();
              reject(new Error("Stream closed before receiving all responses"));
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("event: ")) {
              currentEvent = trimmed.slice(7).trim();
            } else if (trimmed.startsWith("data: ")) {
              const dataContent = trimmed.slice(6).trim();

              if (currentEvent === "endpoint" || dataContent.startsWith("/message")) {
                const messageUrl = `${mcpUrl}${dataContent}`;
                
                // Send all POST tool calls in parallel
                for (const tool of tools) {
                  const reqId = Object.keys(requestIdToKey).find(k => requestIdToKey[Number(k)] === tool.key);
                  if (!reqId) continue;

                  const toolCallBody = {
                    jsonrpc: "2.0",
                    id: Number(reqId),
                    method: "tools/call",
                    params: {
                      name: tool.name,
                      arguments: tool.args
                    }
                  };

                  fetch(messageUrl, {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${apiKey}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(toolCallBody)
                  }).then(async (postRes) => {
                    if (!postRes.ok) {
                      console.error(`Failed to post tool call ${tool.name}: ${postRes.status} ${postRes.statusText}`);
                    }
                  }).catch(err => {
                    console.error(`Error posting tool call ${tool.name}:`, err);
                  });
                }
              } else if (currentEvent === "message" || dataContent.startsWith("{")) {
                try {
                  const msg = JSON.parse(dataContent);
                  if (msg.id && requestIdToKey[msg.id]) {
                    const key = requestIdToKey[msg.id];
                    
                    if (msg.error) {
                      cleanup();
                      clearTimeout(timeout);
                      reject(new Error(`Tool ${pendingRequests.get(msg.id)?.name} failed: ${msg.error.message || JSON.stringify(msg.error)}`));
                      return;
                    }

                    results[key] = msg.result;
                    pendingRequests.delete(msg.id);

                    if (pendingRequests.size === 0) {
                      cleanup();
                      clearTimeout(timeout);
                      resolve(results);
                      return;
                    }
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete/unrelated chunks
                }
              }
            } else if (trimmed === "") {
              currentEvent = "";
            }
          }
        }
      } catch (err) {
        cleanup();
        clearTimeout(timeout);
        reject(err);
      }
    };

    read();
  });
}

async function callMcpTool(toolName: string, args: Record<string, any>): Promise<any> {
  // 1. Connect to SSE
  const sseResponse = await fetch(`${mcpUrl}/sse`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "text/event-stream"
    }
  });

  if (!sseResponse.ok) {
    throw new Error(`Failed to connect to MCP server SSE: ${sseResponse.status} ${sseResponse.statusText}`);
  }

  const reader = sseResponse.body?.getReader();
  if (!reader) {
    throw new Error("No body reader on SSE response");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let messageUrl = "";
  const requestId = Math.floor(Math.random() * 1000000);

  return new Promise((resolve, reject) => {
    let completed = false;

    const cleanup = () => {
      completed = true;
      try {
        reader.releaseLock();
      } catch (e) {}
      try {
        sseResponse.body?.cancel();
      } catch (e) {}
    };

    // Timeout to prevent hanging forever
    const timeout = setTimeout(() => {
      if (!completed) {
        cleanup();
        reject(new Error(`Timeout waiting for response from tool: ${toolName}`));
      }
    }, 15000);

    let currentEvent = "";

    const read = async () => {
      try {
        while (!completed) {
          const { value, done } = await reader.read();
          if (done) {
            if (!completed) {
              cleanup();
              reject(new Error("Stream closed before receiving response"));
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("event: ")) {
              currentEvent = trimmed.slice(7).trim();
            } else if (trimmed.startsWith("data: ")) {
              const dataContent = trimmed.slice(6).trim();

              if (currentEvent === "endpoint" || dataContent.startsWith("/message")) {
                messageUrl = `${mcpUrl}${dataContent}`;
                
                // Send the POST tool call
                const toolCallBody = {
                  jsonrpc: "2.0",
                  id: requestId,
                  method: "tools/call",
                  params: {
                    name: toolName,
                    arguments: args
                  }
                };

                const postRes = await fetch(messageUrl, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(toolCallBody)
                });

                if (!postRes.ok) {
                  cleanup();
                  clearTimeout(timeout);
                  reject(new Error(`Failed to post tool call: ${postRes.status} ${postRes.statusText}`));
                  return;
                }
              } else if (currentEvent === "message" || dataContent.startsWith("{")) {
                try {
                  const msg = JSON.parse(dataContent);
                  if (msg.id === requestId) {
                    cleanup();
                    clearTimeout(timeout);
                    if (msg.error) {
                      reject(new Error(msg.error.message || JSON.stringify(msg.error)));
                    } else {
                      resolve(msg.result);
                    }
                    return;
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete/unrelated chunks
                }
              }
            } else if (trimmed === "") {
              currentEvent = "";
            }
          }
        }
      } catch (err) {
        cleanup();
        clearTimeout(timeout);
        reject(err);
      }
    };

    read();
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!start_date || !end_date) {
      return NextResponse.json({ error: "Missing start_date or end_date parameters." }, { status: 400 });
    }

    // Call all 9 tools multiplexed over a single SSE session to avoid socket exhaustion and timeouts
    const results = await callMcpToolsMultiplexed([
      { key: "revenue", name: "get_revenue_summary", args: { start_date, end_date } },
      { key: "peakHours", name: "get_peak_hours", args: { start_date, end_date } },
      { key: "ordersByTable", name: "get_orders_by_table", args: { start_date, end_date } },
      { key: "mostOrderedItems", name: "get_most_ordered_items", args: { start_date, end_date, limit: 10 } },
      { key: "busiestDays", name: "get_busiest_days", args: { start_date, end_date } },
      { key: "tableTurnover", name: "get_table_turnover", args: { start_date, end_date } },
      { key: "aovTrend", name: "get_average_order_value", args: { start_date, end_date } },
      { key: "completionTime", name: "get_order_completion_time", args: { start_date, end_date } },
      { key: "outreachHistory", name: "get_outreach_history", args: { limit: 50 } }
    ]);

    // Parse the results from JSON text string inside content[0].text
    const revenueSummary = JSON.parse(results.revenue.content[0].text);
    const peakHoursData = JSON.parse(results.peakHours.content[0].text);
    const ordersByTableData = JSON.parse(results.ordersByTable.content[0].text);
    const mostOrderedItemsData = JSON.parse(results.mostOrderedItems.content[0].text);
    const busiestDaysData = JSON.parse(results.busiestDays.content[0].text);
    const tableTurnoverData = JSON.parse(results.tableTurnover.content[0].text);
    const aovTrendData = JSON.parse(results.aovTrend.content[0].text);
    const completionTimeData = JSON.parse(results.completionTime.content[0].text);
    const outreachHistoryRaw = JSON.parse(results.outreachHistory.content[0].text);

    // Join customer profiles in memory for admin dashboard view
    const supabase = createAdminClient();
    const userIds = Array.from(new Set(outreachHistoryRaw.map((m: any) => m.user_id).filter(Boolean)));
    const profileMap: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);
      if (!profilesError && profiles) {
        profiles.forEach(p => {
          profileMap[p.id] = {
            full_name: p.full_name,
            email: p.email,
            avatar_url: p.avatar_url
          };
        });
      }
    }

    const outreachHistory = outreachHistoryRaw.map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      channel: m.channel,
      subject: m.subject,
      body: m.body,
      sent_at: m.sent_at,
      triggered_by: m.triggered_by,
      recipient: m.user_id && profileMap[m.user_id] ? profileMap[m.user_id] : null
    }));

    return NextResponse.json({
      revenue_summary: {
        total_orders: revenueSummary.total_orders,
        completed_orders: revenueSummary.completed_orders,
        pending_orders: revenueSummary.pending_orders,
        total_revenue_inr: revenueSummary.total_revenue_inr,
        average_order_value_inr: revenueSummary.average_order_value_inr,
        completion_rate_pct: revenueSummary.completion_rate_pct || 0
      },
      peak_hours: peakHoursData.all_hours || [],
      orders_by_table: ordersByTableData.tables || [],
      most_ordered_items: mostOrderedItemsData.top_items || [],
      busiest_days: busiestDaysData.days_ranked || [],
      table_turnover: {
        global_avg_minutes: tableTurnoverData.global_avg_minutes,
        by_table: tableTurnoverData.by_table || []
      },
      aov_daily_trend: aovTrendData.daily_trend || [],
      kitchen_performance: completionTimeData,
      outreach_history: outreachHistory
    });

  } catch (error: any) {
    console.error("CRM Dashboard GET error via MCP:", error);
    return NextResponse.json({ error: error.message || "Could not load CRM data via MCP." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { table_number, visit_date, message_body, subject } = await request.json().catch(() => ({}));

    if (!table_number || !visit_date || !message_body) {
      return NextResponse.json({ error: "Missing table_number, visit_date, or message_body in request." }, { status: 400 });
    }

    // Call send_revisit_message tool on the MCP server
    const result = await callMcpTool("send_revisit_message", {
      table_number,
      visit_date,
      message_body,
      subject: subject || undefined
    });

    const parsedResult = JSON.parse(result.content[0].text);

    if (parsedResult.status === 'not_found') {
      return NextResponse.json({ error: parsedResult.message }, { status: 404 });
    }
    if (parsedResult.status === 'no_user') {
      return NextResponse.json({ error: parsedResult.message }, { status: 400 });
    }

    return NextResponse.json({
      status: "simulated",
      message_id: parsedResult.message_id,
      sent_at: parsedResult.sent_at,
      table_number,
      visit_date,
      channel: "simulated",
      note: parsedResult.note
    });

  } catch (error: any) {
    console.error("CRM Outreach POST error via MCP:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch outreach message via MCP." }, { status: 500 });
  }
}
