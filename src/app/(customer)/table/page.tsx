"use client";

import { ArrowRight, Copy, DoorOpen, Hash, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuthUser } from "@/hooks/use-auth-user";
import { createClient } from "@/lib/supabase/client";
import { useTableStore } from "@/stores/table.store";
import { useToastStore } from "@/stores/toasts.store";
import type { Order, TableSession } from "@/types/brewboard";
import { DoodleCup } from "@/components/doodle";

export default function TablePage() {
  const [tableNumber, setTableNumber] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [sessionChecked, setSessionChecked] = useState(false);
  const { user, isLoading: authLoading } = useAuthUser();
  const { activeTable, customerName, setCustomerName, setActiveTable } = useTableStore();
  const addToast = useToastStore((state) => state.addToast);
  const router = useRouter();

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
        const response = await fetch("/api/tables/user-session");
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
      return;
    }

    async function loadActiveOrders() {
      try {
        const response = await fetch(`/api/tables/feed?tableSessionId=${activeTable!.id}`);
        if (response.ok) {
          const body = await response.json();
          if (body.orders) {
            setActiveOrders(body.orders.filter((o: any) => o.status !== "complete"));
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
        throw new Error(body.error ?? "Could not join the table.");
      }

      setActiveTable(body.table);
      addToast(`Joined Table ${body.table.tableNumber}! Say hi!`, "info");
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not join the table.");
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
              onClick={async () => {
                try {
                  await fetch("/api/tables/user-session", { method: "DELETE" });
                } catch (err) {
                  console.error("Failed to clear backend user session:", err);
                }
                setActiveTable(null);
                addToast("Left the table. You can create or join a new one.", "info");
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
    </div>
  );
}
