"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { mapLoveMessage, mapOrder, mapTableSession } from "@/lib/brewboard-mappers";
import { createClient } from "@/lib/supabase/client";
import type { LoveMessage, Order, TableSession } from "@/types/brewboard";

export function useAdminDashboard() {
  const [tables, setTables] = useState<TableSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<LoveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load dashboard data");
      
      const body = (await response.json()) as {
        tables?: TableSession[];
        orders?: Order[];
        messages?: LoveMessage[];
      };

      const nextOrders = body.orders ?? [];
      const activeOrderIds = nextOrders.filter((order) => order.status !== "complete").map((order) => order.id);
      const hasFreshOrder = activeOrderIds.some((id) => !knownOrderIds.current.has(id));

      if (knownOrderIds.current.size > 0 && hasFreshOrder) {
        setHasNewOrder(true);
      }

      knownOrderIds.current = new Set(nextOrders.map((order) => order.id));
      setTables(body.tables ?? []);
      setOrders(nextOrders);
      setMessages(body.messages ?? []);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard().catch(() => setIsLoading(false));
  }, [loadDashboard]);

  // Real-time listener using PostgreSQL changes directly
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("brewboard-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brewboard_orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = mapOrder(payload.new as any);
            setOrders((current) => {
              if (current.some((o) => o.id === newOrder.id)) return current;

              if (newOrder.status !== "complete") {
                if (knownOrderIds.current.size > 0 && !knownOrderIds.current.has(newOrder.id)) {
                  setHasNewOrder(true);
                }
                knownOrderIds.current.add(newOrder.id);
              }

              return [newOrder, ...current];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = mapOrder(payload.new as any);
            setOrders((current) =>
              current.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setOrders((current) => current.filter((o) => o.id !== deletedId));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brewboard_table_sessions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTable = mapTableSession(payload.new as any);
            setTables((current) => {
              if (current.some((t) => t.id === newTable.id)) return current;
              return [newTable, ...current];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTable = mapTableSession(payload.new as any);
            setTables((current) =>
              current.map((t) => (t.id === updatedTable.id ? updatedTable : t))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setTables((current) => current.filter((t) => t.id !== deletedId));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "brewboard_love_messages" },
        (payload) => {
          const newMessage = mapLoveMessage(payload.new as any);
          setMessages((current) => {
            if (current.some((m) => m.id === newMessage.id)) return current;

            // Prevent duplicate message from optimistic updates if it matches details
            const tempIndex = current.findIndex(
              (m) =>
                m.id.startsWith("temp-") &&
                m.body === newMessage.body &&
                m.tableSessionId === newMessage.tableSessionId
            );

            if (tempIndex !== -1) {
              return current.map((m, idx) => (idx === tempIndex ? newMessage : m));
            }

            return [newMessage, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Encapsulated optimistic mutations with rollback
  const completeOrder = useCallback(async (orderId: string) => {
    let originalOrders: Order[] = [];
    setOrders((current) => {
      originalOrders = current;
      return current.map((o) =>
        o.id === orderId ? { ...o, status: "complete" as const } : o
      );
    });

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: "complete" })
      });

      if (!response.ok) {
        throw new Error("Failed to complete order");
      }
      return true;
    } catch (error) {
      console.error("Failed to complete order:", error);
      setOrders(originalOrders); // Rollback
      return false;
    }
  }, []);

  const sendLoveMessage = useCallback(async (tableSessionId: string, body: string) => {
    const tempId = `temp-${Date.now()}`;
    const tempMessage: LoveMessage = {
      id: tempId,
      tableSessionId,
      body: body.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [tempMessage, ...current]);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableSessionId, body: body.trim() })
      });

      if (!response.ok) {
        throw new Error("Failed to send love message");
      }

      const resBody = (await response.json()) as { message?: LoveMessage };
      if (resBody.message) {
        setMessages((current) =>
          current.map((m) => (m.id === tempId ? resBody.message! : m))
        );
      }
      return true;
    } catch (error) {
      console.error("Failed to send love message:", error);
      setMessages((current) => current.filter((m) => m.id !== tempId)); // Rollback
      return false;
    }
  }, []);

  const closeTable = useCallback(async (tableSessionId: string) => {
    let originalTables: TableSession[] = [];
    setTables((current) => {
      originalTables = current;
      return current.map((t) =>
        t.id === tableSessionId ? { ...t, isClosed: true } : t
      );
    });

    try {
      const response = await fetch("/api/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tableSessionId })
      });

      if (!response.ok) {
        throw new Error("Failed to close table");
      }
      return true;
    } catch (error) {
      console.error("Failed to close table:", error);
      setTables(originalTables); // Rollback
      return false;
    }
  }, []);

  return {
    tables,
    orders,
    messages,
    isLoading,
    hasNewOrder,
    clearNewOrderAlert: () => setHasNewOrder(false),
    refresh: loadDashboard,
    completeOrder,
    sendLoveMessage,
    closeTable
  };
}
