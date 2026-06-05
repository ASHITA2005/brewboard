"use client";

import { AlertCircle, BarChart3, Calendar, Check, Clock, Coffee, DollarSign, Mail, RefreshCw, Send, User } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { StatusBadge } from "@/components/status-badge";
import { formatMoney } from "@/lib/utils";

type RevenueSummary = {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_revenue_inr: number;
  average_order_value_inr: number;
  completion_rate_pct: number;
};

type PeakHour = {
  hour: number;
  label: string;
  order_count: number;
  revenue_inr: number;
};

type TableOrder = {
  table_number: string;
  order_count: number;
  revenue_inr: number;
};

type MenuItemStat = {
  name: string;
  category: string;
  total_quantity: number;
  total_revenue_inr: number;
};

type BusiestDay = {
  day: string;
  order_count: number;
  revenue_inr: number;
};

type TableTurnoverStat = {
  table_number: string;
  session_count: number;
  avg_duration_minutes: number;
};

type TableTurnoverData = {
  global_avg_minutes: number;
  by_table: TableTurnoverStat[];
};

type AOVTrend = {
  date: string;
  order_count: number;
  total_revenue_inr: number;
  aov_inr: number;
};

type KitchenPerformance = {
  completed_orders: number;
  avg_minutes: number;
  median_minutes: number;
  p90_minutes: number;
  fastest_minutes: number;
  slowest_minutes: number;
};

type OutreachMessage = {
  id: string;
  user_id: string | null;
  channel: string;
  subject: string | null;
  body: string;
  sent_at: string;
  triggered_by: string;
  recipient: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

type CRMData = {
  revenue_summary: RevenueSummary;
  peak_hours: PeakHour[];
  orders_by_table: TableOrder[];
  most_ordered_items: MenuItemStat[];
  busiest_days: BusiestDay[];
  table_turnover: TableTurnoverData;
  aov_daily_trend: AOVTrend[];
  kitchen_performance: KitchenPerformance;
  outreach_history: OutreachMessage[];
};

export default function CRMPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<CRMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Revisit Outreach Form state
  const [tableNumber, setTableNumber] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Set default dates: past 30 days
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().slice(0, 10);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setVisitDate(formatDate(end));
  }, []);

  async function fetchCRMData(start: string, end: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/crm?start_date=${start}&end_date=${end}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to load CRM data.");
      }
      const resData = await response.json();
      setData(resData);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading CRM data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchCRMData(startDate, endDate);
    }
  }, [startDate, endDate]);

  function handleQuickRange(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const formatDate = (d: Date) => d.toISOString().slice(0, 10);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }

  async function handleSendOutreach(e: React.FormEvent) {
    e.preventDefault();
    if (!tableNumber || !visitDate || !messageBody) {
      setFormMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    setFormSubmitting(true);
    setFormMessage(null);

    try {
      const response = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber,
          visit_date: visitDate,
          subject: subject || undefined,
          message_body: messageBody,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to send simulated outreach message.");
      }

      setFormMessage({
        type: "success",
        text: `Success! Message recorded for Table ${tableNumber} (ID: ${resData.message_id.slice(0, 8)}...)`,
      });

      // Clear form except visit date
      setTableNumber("");
      setSubject("");
      setMessageBody("");

      // Refresh data to show new message in history
      if (startDate && endDate) {
        fetchCRMData(startDate, endDate);
      }
    } catch (err: any) {
      setFormMessage({ type: "error", text: err.message || "Outreach dispatch failed." });
    } finally {
      setFormSubmitting(false);
    }
  }

  // Pre-fill templates helper
  function applyTemplate(templateText: string) {
    setMessageBody(templateText);
  }

  // SVG Helper constants
  const chartHeight = 160;
  const chartWidth = 500;
  const chartPadding = 30;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">admin tools</p>
          <h1>CRM & Analytics</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="secondary-button"
            type="button"
            onClick={() => fetchCRMData(startDate, endDate)}
            disabled={loading}
            aria-label="Refresh data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <span className="ai-pill" style={{ background: "#eef9ff", color: "#23617a", borderColor: "var(--ink)" }}>
            <BarChart3 size={18} />
            Data Live
          </span>
        </div>
      </header>

      {/* Date Filters Section */}
      <section className="hero-panel table-hero" style={{ background: "#fffdf9", display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Calendar size={22} style={{ color: "var(--coffee)" }} />
            <span style={{ fontSize: "19px", fontWeight: "bold", fontFamily: "var(--font-accent)" }}>Filter Date Range:</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className={`chip ${startDate === endDate ? "active" : ""}`} type="button" onClick={() => handleQuickRange(0)}>Today</button>
              <button className={`chip ${startDate && endDate && (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000 === 7 ? "active" : ""}`} type="button" onClick={() => handleQuickRange(7)}>7 Days</button>
              <button className={`chip ${startDate && endDate && (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000 === 30 ? "active" : ""}`} type="button" onClick={() => handleQuickRange(30)}>30 Days</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="startDate" style={{ fontSize: "14px" }}>From</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ minHeight: "38px", padding: "6px 12px", borderRadius: "10px", width: "145px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="endDate" style={{ fontSize: "14px" }}>To</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ minHeight: "38px", padding: "6px 12px", borderRadius: "10px", width: "145px" }}
              />
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="form-error" style={{ fontSize: "18px", padding: "16px", background: "#ffeaf0", border: "2px solid var(--ink)", borderRadius: "12px" }}>{error}</p> : null}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 0" }}>
          <RefreshCw className="animate-spin" size={36} style={{ color: "var(--coffee)" }} />
          <p style={{ fontFamily: "var(--font-accent)", fontSize: "20px", fontWeight: "bold" }}>Assembling café metrics...</p>
        </div>
      ) : data ? (
        <>
          {/* Top Level Metric Cards */}
          <section className="table-card-grid">
            <article className="table-card" style={{ borderLeft: "6px solid var(--coffee)" }}>
              <span className="eyebrow">Total Revenue</span>
              <strong style={{ fontSize: "36px", color: "var(--espresso)" }}>{formatMoney(data.revenue_summary.total_revenue_inr)}</strong>
              <div style={{ fontSize: "14px", color: "var(--latte)", fontWeight: "bold" }}>
                From {data.revenue_summary.completed_orders} completed orders
              </div>
            </article>

            <article className="table-card" style={{ borderLeft: "6px solid var(--caramel)" }}>
              <span className="eyebrow">Order Summary</span>
              <strong style={{ fontSize: "36px", color: "var(--espresso)" }}>{data.revenue_summary.total_orders}</strong>
              <div style={{ display: "flex", gap: "10px", fontSize: "13px", fontWeight: "bold" }}>
                <span style={{ color: "#25624a" }}>● {data.revenue_summary.completed_orders} Completed</span>
                <span style={{ color: "#23617a" }}>● {data.revenue_summary.pending_orders} Pending</span>
              </div>
            </article>

            <article className="table-card" style={{ borderLeft: "6px solid var(--mint)" }}>
              <span className="eyebrow">Average Order Value</span>
              <strong style={{ fontSize: "36px", color: "var(--espresso)" }}>{formatMoney(data.revenue_summary.average_order_value_inr)}</strong>
              <div style={{ fontSize: "14px", color: "var(--latte)", fontWeight: "bold" }}>
                AOV completion rate: {data.revenue_summary.completion_rate_pct}%
              </div>
            </article>

            <article className="table-card" style={{ borderLeft: "6px solid var(--lavender)" }}>
              <span className="eyebrow">Avg Kitchen Prep</span>
              <strong style={{ fontSize: "36px", color: "var(--espresso)" }}>
                {data.kitchen_performance.avg_minutes > 0 ? `${data.kitchen_performance.avg_minutes}m` : "N/A"}
              </strong>
              <div style={{ fontSize: "13px", color: "var(--latte)", fontWeight: "bold" }}>
                Median: {data.kitchen_performance.median_minutes}m | P90: {data.kitchen_performance.p90_minutes}m
              </div>
            </article>
          </section>

          {/* Charts Row */}
          <section className="admin-grid" style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Daily AOV Trend Line Chart */}
              <div className="archive-section" style={{ padding: "24px" }}>
                <div className="section-heading compact">
                  <DollarSign size={22} style={{ color: "var(--coffee)" }} />
                  <div>
                    <h2>Daily Spending Trend (AOV in INR)</h2>
                    <p>Track customer spend and AOV daily trajectory.</p>
                  </div>
                </div>

                <div style={{ width: "100%", overflowX: "auto", marginTop: "20px" }}>
                  {data.aov_daily_trend.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--latte)", fontFamily: "var(--font-accent)", fontSize: "18px" }}>
                      No completed order data available in this range to plot trend line.
                    </div>
                  ) : (
                    <div style={{ minWidth: "500px", padding: "10px" }}>
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", overflow: "visible" }} aria-label="AOV Daily Trend Line Chart">
                        {/* Grids */}
                        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
                          <line
                            key={idx}
                            x1={chartPadding}
                            y1={chartPadding + r * (chartHeight - 2 * chartPadding)}
                            x2={chartWidth - chartPadding}
                            y2={chartPadding + r * (chartHeight - 2 * chartPadding)}
                            stroke="#e0d5c1"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                        ))}

                        {/* Calculate Points */}
                        {(() => {
                          const trends = data.aov_daily_trend;
                          const maxAov = Math.max(...trends.map(t => t.aov_inr), 100);
                          const minAov = Math.min(...trends.map(t => t.aov_inr), 0);
                          const range = maxAov - minAov || 1;

                          const points = trends.map((t, idx) => {
                            const x = chartPadding + (idx / (trends.length - 1 || 1)) * (chartWidth - 2 * chartPadding);
                            const y = chartHeight - chartPadding - ((t.aov_inr - minAov) / range) * (chartHeight - 2 * chartPadding);
                            return { x, y, date: t.date, aov: t.aov_inr };
                          });

                          const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                          return (
                            <>
                              {/* Line Path */}
                              <path d={pathD} fill="none" stroke="var(--coffee)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                              {/* Points */}
                              {points.map((p, idx) => (
                                <g key={idx} className="chart-dot-group">
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="6"
                                    fill="var(--caramel)"
                                    stroke="var(--ink)"
                                    strokeWidth="2.5"
                                  />
                                  <text
                                    x={p.x}
                                    y={p.y - 12}
                                    textAnchor="middle"
                                    style={{ fontSize: "11px", fontWeight: "bold", fontFamily: "var(--font-mono)", fill: "var(--espresso)" }}
                                  >
                                    ₹{Math.round(p.aov)}
                                  </text>
                                  <text
                                    x={p.x}
                                    y={chartHeight - 10}
                                    textAnchor="middle"
                                    style={{ fontSize: "10px", fontFamily: "var(--font-accent)", fill: "var(--latte)", fontWeight: "bold" }}
                                  >
                                    {p.date.slice(5)}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Peak Hours & Busiest Days Columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Busiest Days Bar Chart */}
                <div className="archive-section" style={{ padding: "20px" }}>
                  <div className="section-heading compact">
                    <BarChart3 size={20} style={{ color: "var(--coffee)" }} />
                    <h2>Busiest Days</h2>
                  </div>

                  <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {data.busiest_days.map((day) => {
                      const maxOrders = Math.max(...data.busiest_days.map(d => d.order_count), 1);
                      const pct = (day.order_count / maxOrders) * 100;
                      return (
                        <div key={day.day} style={{ display: "grid", gridTemplateColumns: "85px 1fr 45px", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--espresso)" }}>{day.day}</span>
                          <div style={{ height: "18px", border: "2px solid var(--ink)", borderRadius: "8px", background: "#fff", overflow: "hidden", position: "relative", boxShadow: "1px 1px 0 var(--ink)" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "var(--caramel)",
                                transition: "width 0.5s ease"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "bold", fontFamily: "var(--font-mono)", textAlign: "right" }}>{day.order_count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Peak Hours Summary List */}
                <div className="archive-section" style={{ padding: "20px" }}>
                  <div className="section-heading compact">
                    <Clock size={20} style={{ color: "var(--coffee)" }} />
                    <h2>Peak Hours (IST)</h2>
                  </div>

                  <div style={{ height: "230px", overflowY: "auto", marginTop: "12px", border: "2px solid var(--ink)", borderRadius: "12px", padding: "8px", background: "#fffcf7" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "2px solid var(--ink)", paddingBottom: "6px", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold", color: "var(--latte)" }}>
                      <span>Hour</span>
                      <span style={{ textAlign: "center" }}>Orders</span>
                      <span style={{ textAlign: "right" }}>Revenue</span>
                    </div>
                    {data.peak_hours.filter(h => h.order_count > 0).map((h) => (
                      <div key={h.hour} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "6px 0", borderBottom: "1px dashed rgba(107,58,42,0.15)", fontSize: "14px", fontWeight: "bold" }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{h.label}</span>
                        <span style={{ textAlign: "center" }}>{h.order_count}</span>
                        <span style={{ textAlign: "right", color: "var(--coffee)" }}>{formatMoney(h.revenue_inr)}</span>
                      </div>
                    ))}
                    {data.peak_hours.filter(h => h.order_count > 0).length === 0 ? (
                      <p style={{ textAlign: "center", color: "var(--latte)", paddingTop: "40px", fontFamily: "var(--font-accent)", fontSize: "16px" }}>No orders placed in this range.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Bestsellers Table */}
              <div className="archive-section" style={{ padding: "24px" }}>
                <div className="section-heading compact">
                  <Coffee size={22} style={{ color: "var(--coffee)" }} />
                  <div>
                    <h2>Bestselling Items</h2>
                    <p>Menu items ranked by quantity sold.</p>
                  </div>
                </div>

                <div style={{ overflowX: "auto", marginTop: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2.5px solid var(--ink)", color: "var(--latte)", textTransform: "lowercase", fontSize: "15px", fontFamily: "var(--font-accent)", fontWeight: "bold" }}>
                        <th style={{ padding: "8px 12px" }}>Item Name</th>
                        <th style={{ padding: "8px 12px" }}>Category</th>
                        <th style={{ padding: "8px 12px", textAlign: "center" }}>Qty Sold</th>
                        <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.most_ordered_items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1.5px dashed rgba(107, 58, 42, 0.15)", fontWeight: "bold", fontSize: "15px" }}>
                          <td style={{ padding: "10px 12px" }}>{item.name}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span className="category-badge caramel" style={{ fontSize: "12px", padding: "2px 8px" }}>{item.category}</span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "var(--font-mono)" }}>{item.total_quantity}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--coffee)" }}>{formatMoney(item.total_revenue_inr)}</td>
                        </tr>
                      ))}
                      {data.most_ordered_items.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--latte)", fontFamily: "var(--font-accent)", fontSize: "16px" }}>No items sold in this date range.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Metrics Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Orders by Table */}
                <div className="archive-section" style={{ padding: "20px" }}>
                  <div className="section-heading compact">
                    <BarChart3 size={20} style={{ color: "var(--coffee)" }} />
                    <h2>Orders by Table</h2>
                  </div>
                  <div style={{ maxHeight: "250px", overflowY: "auto", marginTop: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--ink)", color: "var(--latte)", fontWeight: "bold" }}>
                          <th style={{ padding: "6px", textAlign: "left" }}>Table</th>
                          <th style={{ padding: "6px", textAlign: "center" }}>Orders</th>
                          <th style={{ padding: "6px", textAlign: "right" }}>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders_by_table.map((t) => (
                          <tr key={t.table_number} style={{ borderBottom: "1px dashed rgba(107,58,42,0.15)", fontWeight: "bold" }}>
                            <td style={{ padding: "8px 6px" }}>Table {t.table_number}</td>
                            <td style={{ padding: "8px 6px", textAlign: "center" }}>{t.order_count}</td>
                            <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--coffee)" }}>{formatMoney(t.revenue_inr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Turnover (Duration) */}
                <div className="archive-section" style={{ padding: "20px" }}>
                  <div className="section-heading compact">
                    <Clock size={20} style={{ color: "var(--coffee)" }} />
                    <div>
                      <h2>Table Turnover</h2>
                      <p style={{ fontSize: "12px" }}>Global Avg: {data.table_turnover.global_avg_minutes} min</p>
                    </div>
                  </div>
                  <div style={{ maxHeight: "250px", overflowY: "auto", marginTop: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--ink)", color: "var(--latte)", fontWeight: "bold" }}>
                          <th style={{ padding: "6px", textAlign: "left" }}>Table</th>
                          <th style={{ padding: "6px", textAlign: "center" }}>Sessions</th>
                          <th style={{ padding: "6px", textAlign: "right" }}>Avg Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.table_turnover.by_table.map((t) => (
                          <tr key={t.table_number} style={{ borderBottom: "1px dashed rgba(107,58,42,0.15)", fontWeight: "bold" }}>
                            <td style={{ padding: "8px 6px" }}>Table {t.table_number}</td>
                            <td style={{ padding: "8px 6px", textAlign: "center" }}>{t.session_count}</td>
                            <td style={{ padding: "8px 6px", textAlign: "right" }}>{t.avg_duration_minutes} min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Drawer: Send Outreach & History */}
            <aside className="order-drawer" style={{ display: "flex", flexDirection: "column", gap: "24px", alignSelf: "start" }}>
              {/* Outreach Composer */}
              <div className="love-panel" style={{ margin: 0, padding: "20px", background: "#fffdf9" }}>
                <div className="section-heading compact">
                  <Mail size={22} style={{ color: "var(--coffee)" }} />
                  <div>
                    <h3>Revisit Outreach</h3>
                    <p>Dispatch simulated post-visit feedback discount offers.</p>
                  </div>
                </div>

                <form onSubmit={handleSendOutreach} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                  <div>
                    <label htmlFor="tableNum" style={{ display: "block", marginBottom: "4px" }}>Table Number <span style={{ color: "#c44" }}>*</span></label>
                    <input
                      id="tableNum"
                      type="text"
                      placeholder="e.g. 5"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      required
                      style={{ minHeight: "36px", padding: "6px 12px", borderRadius: "10px" }}
                    />
                  </div>

                  <div>
                    <label htmlFor="visitDate" style={{ display: "block", marginBottom: "4px" }}>Visit Date <span style={{ color: "#c44" }}>*</span></label>
                    <input
                      id="visitDate"
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      required
                      style={{ minHeight: "36px", padding: "6px 12px", borderRadius: "10px" }}
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" style={{ display: "block", marginBottom: "4px" }}>Subject <small>(optional)</small></label>
                    <input
                      id="subject"
                      type="text"
                      placeholder="e.g. Rate your visit today!"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ minHeight: "36px", padding: "6px 12px", borderRadius: "10px" }}
                    />
                  </div>

                  <div>
                    <label htmlFor="bodyText" style={{ display: "block", marginBottom: "4px" }}>Message Body <span style={{ color: "#c44" }}>*</span></label>
                    <textarea
                      id="bodyText"
                      placeholder="Write your email body..."
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      required
                      style={{ minHeight: "88px", padding: "8px 12px", borderRadius: "10px", fontSize: "14px" }}
                    />
                  </div>

                  {/* Predefined Templates */}
                  <div style={{ marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--latte)" }}>Templates:</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                      <button
                        type="button"
                        className="chip"
                        style={{ padding: "4px 8px", minHeight: "26px", fontSize: "11px", borderRadius: "6px" }}
                        onClick={() => applyTemplate("Thanks for visiting BrewBoard! We'd love to hear how your cold brew was. Review your visit and get 15% off your next cup!")}
                      >
                        15% Discount Review
                      </button>
                      <button
                        type="button"
                        className="chip"
                        style={{ padding: "4px 8px", minHeight: "26px", fontSize: "11px", borderRadius: "6px" }}
                        onClick={() => applyTemplate("We noticed you ordered the Almond Croissant today! We hope it was warm and flaky. Join our loyalty program to get a free bakery item next time.")}
                      >
                        Bakery Loyalty Offer
                      </button>
                    </div>
                  </div>

                  {formMessage ? (
                    <div
                      style={{
                        padding: "10px 12px",
                        border: "2px solid var(--ink)",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        background: formMessage.type === "success" ? "#e8f8f1" : "#ffeaf0",
                        color: formMessage.type === "success" ? "#25624a" : "#8f2d16",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {formMessage.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                      <span>{formMessage.text}</span>
                    </div>
                  ) : null}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={formSubmitting}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}
                  >
                    <Send size={16} />
                    {formSubmitting ? "Dispatching..." : "Send Revisit Message"}
                  </button>
                </form>
              </div>

              {/* Outreach Logs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--espresso)" }}>Outreach History</h3>
                  <span className="category-badge caramel" style={{ fontSize: "11px" }}>Total: {data.outreach_history.length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "360px", overflowY: "auto", border: "2px solid var(--ink)", borderRadius: "16px", padding: "10px", background: "white" }}>
                  {data.outreach_history.map((m) => (
                    <article key={m.id} style={{ border: "1.5px solid var(--ink)", borderRadius: "12px", padding: "10px", background: "#fffcf7", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "1.5px 1.5px 0 var(--ink)" }}>
                      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <User size={12} style={{ color: "var(--coffee)" }} />
                          <strong style={{ color: "var(--espresso)" }}>{m.recipient?.full_name || "Customer"}</strong>
                        </div>
                        <span style={{ color: "var(--latte)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                          {new Date(m.sent_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </header>
                      {m.subject && (
                        <div style={{ fontSize: "13px", fontWeight: "bold", borderBottom: "1px dashed rgba(107,58,42,0.15)", paddingBottom: "2px" }}>
                          Subject: {m.subject}
                        </div>
                      )}
                      <p style={{ fontSize: "13px", color: "var(--ink)", lineHeight: "1.3", margin: 0 }}>
                        {m.body}
                      </p>
                      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", fontSize: "11px" }}>
                        <span style={{ color: "var(--latte)" }}>{m.recipient?.email || "No email"}</span>
                        <span className="status-badge complete" style={{ fontSize: "9px", padding: "1px 6px" }}>{m.channel}</span>
                      </footer>
                    </article>
                  ))}
                  {data.outreach_history.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--latte)", padding: "20px 0", fontFamily: "var(--font-accent)", fontSize: "16px" }}>
                      No outreach messages recorded yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </aside>
          </section>
        </>
      ) : null}
    </div>
  );
}
