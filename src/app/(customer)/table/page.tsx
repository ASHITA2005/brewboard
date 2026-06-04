"use client";

import { ArrowRight, Check, Copy, CreditCard, DoorOpen, Hash, LogOut, QrCode, Smartphone, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuthUser } from "@/hooks/use-auth-user";
import { createClient } from "@/lib/supabase/client";
import { useTableStore } from "@/stores/table.store";
import { useToastStore } from "@/stores/toasts.store";
import { formatMoney } from "@/lib/utils";
import type { Order, TableSession } from "@/types/brewboard";
import { DoodleCup } from "@/components/doodle";

export default function TablePage() {
  const [tableNumber, setTableNumber] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success">("idle");
  const [sessionChecked, setSessionChecked] = useState(false);
  const { user, isLoading: authLoading } = useAuthUser();

  const tableTotal = useMemo(() => {
    return allOrders.reduce((sum, order) => {
      const orderSum = order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
      return sum + orderSum;
    }, 0);
  }, [allOrders]);
  const { activeTable, customerName, setCustomerName, setActiveTable } = useTableStore();
  const addToast = useToastStore((state) => state.addToast);
  const router = useRouter();

  async function leaveTable() {
    try {
      await fetch("/api/tables/user-session", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear backend user session:", err);
    }
    setActiveTable(null);
    addToast("Left the table. You can create or join a new one.", "info");
  }

  async function simulatePaymentAndLeave() {
    if (!activeTable) return;
    setPaymentState("processing");

    // Wait 1.5s to simulate payment authorization
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setPaymentState("success");

    // Wait 1.2s to show success state
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      // 1. Close table session in database
      const response = await fetch("/api/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeTable.id })
      });
      if (!response.ok) throw new Error("Could not close table in db");

      // 2. Clear backend user session mapping
      await fetch("/api/tables/user-session", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to close/leave table during payment checkout:", err);
    }

    // 3. Clear local Zustand state and redirect
    setActiveTable(null);
    setIsPaymentOpen(false);
    setPaymentState("idle");
    addToast("Table bill paid successfully! Left the table.", "success");
    router.push("/table");
  }

  async function handleSignOut() {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setActiveTable(null);
    router.push("/login");
  }

  useEffect(() => {
    const profileName =
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      user?.email?.split("@")[0];

    if (profileName) {
      setCustomerName(profileName);
    }
  }, [setCustomerName, user]);

  useEffect(() => {
    if (!user || sessionChecked) return;

    async function restoreSession() {
      try {
        const response = await fetch("/api/tables/user-session", { cache: "no-store" });
        if (response.ok) {
          const body = await response.json();
          if (body.table) {
            setActiveTable(body.table);
          } else {
            setActiveTable(null);
          }
        }
      } catch (err) {
        console.error("Failed to restore table session:", err);
      } finally {
        setSessionChecked(true);
      }
    }

    restoreSession();
  }, [user, setActiveTable, sessionChecked]);

  useEffect(() => {
    if (!activeTable) {
      setActiveOrders([]);
      setAllOrders([]);
      return;
    }

    async function loadActiveOrders() {
      try {
        const response = await fetch(`/api/tables/feed?tableSessionId=${activeTable!.id}`, { cache: "no-store" });
        if (response.ok) {
          const body = await response.json();
          if (body.orders) {
            setActiveOrders(body.orders.filter((o: any) => o.status !== "complete"));
            setAllOrders(body.orders);
          }
        }
      } catch (err) {
        console.error("Failed to load active orders:", err);
      }
    }

    loadActiveOrders();

    const supabase = createClient();
    const channel = supabase
      .channel(`table-active-orders-${activeTable.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brewboard_orders",
          filter: `table_session_id=eq.${activeTable.id}`
        },
        () => {
          loadActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTable]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tableNumber.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: tableNumber.trim(), ownerName: customerName })
      });
      const body = (await response.json()) as { table?: TableSession; error?: string };

      if (!response.ok || !body.table) {
        throw new Error(body.error ?? "Could not create the table.");
      }

      setActiveTable(body.table);
      addToast(`Table session created for Table ${body.table.tableNumber}!`, "success");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the table.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (joinCode.trim().length !== 6) {
      setError("Use the 6-character code from your table mate.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tables/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() })
      });
      const body = (await response.json()) as { table?: TableSession; error?: string };

      if (!response.ok || !body.table) {
        throw new Error(body.error ?? "We couldn't join the table. Check your connection and try again.");
      }

      setActiveTable(body.table);
      addToast(`Joined Table ${body.table.tableNumber}! Say hi!`, "info");
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "We couldn't join the table. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const showLoading = authLoading || (!!user && !sessionChecked);

  if (showLoading) {
    return (
      <div className="page-stack" style={{ justifyContent: "center", alignItems: "center", minHeight: "60vh", textAlign: "center" }}>
        <DoodleCup />
        <p className="tagline" style={{ marginTop: "24px" }}>Restoring your table session...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-panel table-hero">
        <div>
          <p className="eyebrow">table session</p>
          <h1>Gather your table</h1>
          <p>Start a shared session or join friends with the table code.</p>
        </div>
        {activeTable ? (
          <div className="code-card">
            <span>Current code</span>
            <strong>{activeTable.code}</strong>
            <small>Table {activeTable.tableNumber}</small>
          </div>
        ) : null}
      </section>

      <section className="split-grid">
        {!activeTable || activeTable.isClosed ? (
          <>
            <form className="action-card caramel" onSubmit={handleCreate}>
              <Users size={38} />
              <h2>Create a Table</h2>
              <label htmlFor="customer-name">Your name</label>
              <input
                id="customer-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Asha"
              />
              <label htmlFor="table-number">Physical table number</label>
              <input
                id="table-number"
                inputMode="numeric"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                placeholder="7"
              />
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Session"}
                <ArrowRight size={18} />
              </button>
            </form>

            <form className="action-card sky" onSubmit={handleJoin}>
              <DoorOpen size={38} />
              <h2>Join a Table</h2>
              <label htmlFor="join-code">Six-character table code</label>
              <input
                id="join-code"
                className={error ? "shake" : ""}
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase().slice(0, 6))}
                placeholder="BREW42"
                maxLength={6}
              />
              {error ? <p className="form-error">{error}</p> : null}
              <button className="secondary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Joining..." : "Join Table"}
                <Hash size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="action-card caramel" style={{ textAlign: "center", gridColumn: "1 / -1" }}>
            <Users size={38} />
            <h2>Your Active Table</h2>
            <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.6)", marginBottom: "8px" }}>
              You&apos;re seated and ready to order.
            </p>
            <div className="code-card" style={{ margin: "12px 0" }}>
              <span>Table</span>
              <strong>{activeTable.tableNumber}</strong>
              <small>Code: {activeTable.code}</small>
            </div>
            <Link href="/menu" className="primary-button" style={{ width: "100%" }}>
              Continue Ordering
              <ArrowRight size={18} />
            </Link>
            <button
              className="secondary-button"
              type="button"
              style={{ width: "100%", marginTop: "8px" }}
              onClick={() => {
                if (tableTotal > 0) {
                  setIsPaymentOpen(true);
                  setPaymentState("idle");
                  setPaymentMethod("card");
                } else {
                  leaveTable();
                }
              }}
            >
              Leave This Table
            </button>
            <button
              className="secondary-button"
              type="button"
              style={{ width: "100%", marginTop: "8px", borderColor: "#c44", color: "#c44" }}
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </section>

      {activeTable ? (
        <section className="reveal-card">
          <Copy size={28} />
          <div>
            <p className="eyebrow">share this code</p>
            <strong>{activeTable.code}</strong>
            <span>Friends can join and see previous orders and love messages.</span>
          </div>
          <Link href="/menu" className="primary-button">
            Start Ordering
          </Link>
        </section>
      ) : null}

      {activeTable && activeOrders.length > 0 ? (
        <section className="reveal-card caramel" style={{ marginTop: "24px" }}>
          <div style={{ width: "100%" }}>
            <p className="eyebrow">active orders at this table</p>
            <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>Preparing for your table</h2>
            <div className="active-orders-list" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "16px" }}>
              {activeOrders.map((order) => (
                <div key={order.id} className="active-order-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "2px solid var(--border-color)", borderRadius: "12px", background: "white", boxShadow: "2px 2px 0 var(--border-color)", color: "black" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="avatar" style={{ width: "32px", height: "32px", fontSize: "16px", background: "var(--mint-tint)", margin: 0 }}>{order.customer.name.slice(0, 1)}</div>
                    <div style={{ textAlign: "left" }}>
                      <strong style={{ fontSize: "16px", display: "block" }}>{order.customer.name}</strong>
                      <span style={{ fontSize: "14px", color: "rgba(0,0,0,0.6)" }}>
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge ${order.status}`} style={{ margin: 0, textTransform: "capitalize", padding: "4px 10px", fontSize: "12px" }}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isPaymentOpen && (
        <div className="payment-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h2>Payment Simulation</h2>
              <p>BrewBoard Café • Table {activeTable?.tableNumber}</p>
            </div>

            {paymentState === "idle" && (
              <>
                <div style={{ textAlign: "center", fontSize: "16px", color: "var(--ink)", padding: "12px 0" }}>
                  Total Amount to Pay: <strong style={{ fontSize: "22px", display: "block", marginTop: "4px" }}>{formatMoney(tableTotal)}</strong>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "bold" }}>Select Simulated Method</span>
                  <div className="payment-option-grid">
                    <button
                      type="button"
                      className={`payment-option-card ${paymentMethod === "card" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <CreditCard size={24} />
                      <span>Card</span>
                    </button>
                    <button
                      type="button"
                      className={`payment-option-card ${paymentMethod === "upi" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("upi")}
                    >
                      <Smartphone size={24} />
                      <span>UPI</span>
                    </button>
                    <button
                      type="button"
                      className={`payment-option-card ${paymentMethod === "qr" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("qr")}
                    >
                      <QrCode size={24} />
                      <span>QR Code</span>
                    </button>
                  </div>
                </div>

                <div className="payment-modal-footer" style={{ marginTop: "12px" }}>
                  <button
                    className="primary-button"
                    type="button"
                    style={{ width: "100%" }}
                    onClick={simulatePaymentAndLeave}
                  >
                    Simulate Success Pay
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    style={{ width: "100%" }}
                    onClick={() => setIsPaymentOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {paymentState === "processing" && (
              <div className="payment-status-wrapper">
                <div className="payment-spinner" />
                <strong style={{ fontSize: "18px" }}>Authorizing Payment...</strong>
                <p style={{ color: "rgba(0,0,0,0.6)" }}>Simulating secure transaction gateway</p>
              </div>
            )}

            {paymentState === "success" && (
              <div className="payment-status-wrapper">
                <div className="payment-success-icon">
                  <Check size={36} strokeWidth={3} />
                </div>
                <strong style={{ fontSize: "20px", color: "var(--espresso)" }}>Payment Successful!</strong>
                <p style={{ color: "rgba(0,0,0,0.6)" }}>Completing your table check-out...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
