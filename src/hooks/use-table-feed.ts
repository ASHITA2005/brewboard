"use client";

import { useCallback, useEffect, useState } from "react";

import { mapLoveMessage, mapOrder } from "@/lib/brewboard-mappers";
import { createClient } from "@/lib/supabase/client";
import type { LoveMessage, Order } from "@/types/brewboard";

export function useTableFeed(tableSessionId: string | undefined, onTableClosed?: () => void) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<LoveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    if (!tableSessionId) {
      setOrders([]);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      const query = `tableSessionId=${encodeURIComponent(tableSessionId)}`;
      const response = await fetch(`/api/tables/feed?${query}`);
      
      if (!response.ok) throw new Error("Could not load feed");
      
      const body = (await response.json()) as {
        isClosed?: boolean;
        orders?: Order[];
        messages?: LoveMessage[];
      };

      if (body.isClosed) {
        onTableClosed?.();
        return;
      }

      setOrders(body.orders ?? []);
      setMessages(body.messages ?? []);
    } catch (error) {
      console.error("Error loading table feed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tableSessionId, onTableClosed]);

  useEffect(() => {
    setIsLoading(true);
    loadFeed().catch(() => setIsLoading(false));
  }, [loadFeed]);

  useEffect(() => {
    if (!tableSessionId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`brewboard-table-${tableSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brewboard_orders",
          filter: `table_session_id=eq.${tableSessionId}`
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = mapOrder(payload.new as any);
            setOrders((current) => {
              if (current.some((o) => o.id === newOrder.id)) return current;
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
        {
          event: "INSERT",
          schema: "public",
          table: "brewboard_love_messages",
          filter: `table_session_id=eq.${tableSessionId}`
        },
        (payload) => {
          const newMessage = mapLoveMessage(payload.new as any);
          setMessages((current) => {
            if (current.some((m) => m.id === newMessage.id)) return current;
            return [newMessage, ...current];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "brewboard_table_sessions",
          filter: `id=eq.${tableSessionId}`
        },
        (payload) => {
          const updated = payload.new as { is_closed?: boolean };
          if (updated && updated.is_closed) {
            onTableClosed?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableSessionId, onTableClosed]);

  return { orders, messages, isLoading, refresh: loadFeed };
}


