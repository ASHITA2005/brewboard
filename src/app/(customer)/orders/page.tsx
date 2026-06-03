"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Coffee, MessageCircleHeart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { StatusBadge } from "@/components/status-badge";
import { PageTabs } from "@/components/page-tabs";
import { useTableFeed } from "@/hooks/use-table-feed";
import { formatMoney } from "@/lib/utils";
import { useTableStore } from "@/stores/table.store";
import { useToastStore } from "@/stores/toasts.store";

export default function OrdersPage() {
  const activeTable = useTableStore((state) => state.activeTable);
  const setActiveTable = useTableStore((state) => state.setActiveTable);
  const addToast = useToastStore((state) => state.addToast);
  const router = useRouter();

  const handleTableClosed = useCallback(() => {
    setActiveTable(null);
    addToast("This table session was closed by the café staff. Thank you!", "error");
    router.push("/table");
  }, [setActiveTable, addToast, router]);

  const { orders, messages, isLoading } = useTableFeed(activeTable?.id, handleTableClosed);
  const latestMessage = messages[0];
  const lastMessageIdRef = useRef<string | null>(null);

  // Real-time Love Message Toast Notification
  useEffect(() => {
    if (!latestMessage) return;

    // Set the initial message ID without triggering a toast on mount
    if (lastMessageIdRef.current === null) {
      lastMessageIdRef.current = latestMessage.id;
      return;
    }

    if (latestMessage.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = latestMessage.id;
      addToast(latestMessage.body, "love");
    }
  }, [latestMessage, addToast]);

  if (!activeTable) {
    return (
      <div className="page-stack feed-page">
        <section className="empty-state">
          <Coffee size={64} />
          <p>Create or join a table to see the live feed.</p>
          <Link className="primary-button" href="/table">
            Go to Table
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack feed-page">
      <section className="sticky-feed-header">
        <div>
          <p className="eyebrow">live order feed</p>
          <h1>Table {activeTable.tableNumber}</h1>
        </div>
        <span className="code-pill">{activeTable.code}</span>
      </section>

      <PageTabs />
 
      {latestMessage ? (
        <div className="love-banner">
          <Bell size={22} />
          <div>
            <strong>{latestMessage.body}</strong>
            <span>
              {formatDistanceToNow(new Date(latestMessage.createdAt), { addSuffix: true })} · saved for everyone at
              this table
            </span>
          </div>
        </div>
      ) : null}


      {isLoading ? (
        <section className="empty-state">
          <p>Loading your table feed...</p>
        </section>
      ) : orders.length === 0 ? (
        <section className="empty-state">
          <Coffee size={64} />
          <p>Nothing here yet - start ordering!</p>
          <Link className="primary-button" href="/menu">
            Browse Menu
          </Link>
        </section>
      ) : (
        <section className="feed-list" aria-live="polite">
          {orders.map((order, index) => (
            <article className="order-card" key={order.id}>
              <header>
                <div className="avatar">{order.customer.name.slice(0, 1)}</div>
                <div>
                  <h2>Order #{orders.length - index}</h2>
                  <p>
                    {order.customer.name} · {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </header>
              <ul>
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.name}`}>
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <strong>{formatMoney(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}

      <section className="resume-note">
        <MessageCircleHeart size={22} />
        BrewBoard automatically restores your active table, cart, and live order feed if your session is refreshed.
      </section>
    </div>
  );
}
