"use client";

import { formatDistanceToNow } from "date-fns";
import { Archive, Bell, CheckCircle2, DoorClosed, MessageCircleHeart, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { messageTemplates } from "@/lib/sample-data";
import { formatMoney } from "@/lib/utils";
import type { LoveMessage } from "@/types/brewboard";

export default function AdminDashboardPage() {
  const {
    tables,
    orders,
    messages,
    isLoading,
    hasNewOrder,
    clearNewOrderAlert,
    completeOrder,
    sendLoveMessage,
    closeTable
  } = useAdminDashboard();

  // Web Audio API cafe chime alert when a new order is received
  useEffect(() => {
    if (!hasNewOrder) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const now = context.currentTime;

      // High pleasant café chime (D5 -> A5 and D6 double synthesizer tone)
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gain = context.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(587.33, now);
      osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6

      gain.gain.setValueAtTime(0.08, now); // Sweet soft chime volume
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(context.destination);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch {
      // AudioContext could fail if blocked by browser autoplay policy
    }
  }, [hasNewOrder]);

  const openTables = tables.filter((table) => !table.isClosed);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [actionError, setActionError] = useState("");


  const selectedTable = openTables.find((table) => table.id === selectedTableId) ?? openTables[0];
  const selectedTableIdResolved = selectedTable?.id ?? "";

  const selectedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.tableSessionId === selectedTableIdResolved && order.status !== "complete"
      ),
    [orders, selectedTableIdResolved]
  );

  const tableMessages = useMemo(
    () =>
      messages.filter((message) => message.tableSessionId === selectedTableIdResolved) as LoveMessage[],
    [messages, selectedTableIdResolved]
  );

  const completedOrders = orders.filter((order) => order.status === "complete");
  const closedTables = tables.filter((table) => table.isClosed);

  async function markOrderComplete(orderId: string) {
    setActionError("");
    const success = await completeOrder(orderId);
    if (!success) {
      setActionError("Could not complete the order.");
    }
  }

  async function sendMessage(body: string) {
    if (!selectedTableIdResolved || !body.trim()) return;
    setIsSending(true);
    setActionError("");

    const success = await sendLoveMessage(selectedTableIdResolved, body);
    if (!success) {
      setActionError("Could not send the message.");
    } else {
      setCustomMessage("");
    }
    setIsSending(false);
  }

  async function closeSelectedTable() {
    if (!selectedTableIdResolved) return;
    setActionError("");

    const success = await closeTable(selectedTableIdResolved);
    if (!success) {
      setActionError("Could not close this table.");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">staff dashboard</p>
          <h1>Active orders</h1>
        </div>
        <button
          className={hasNewOrder ? "alert-pill pulse" : "alert-pill"}
          type="button"
          onClick={clearNewOrderAlert}
        >
          <Bell size={18} />
          {hasNewOrder ? "New order received" : "Realtime queue live"}
        </button>
      </header>

      {actionError ? <p className="form-error">{actionError}</p> : null}

      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : (
        <section className="admin-grid">
          <div className="table-card-grid">
            {openTables.length === 0 ? (
              <p>No active tables right now.</p>
            ) : (
              openTables.map((table) => {
                const tableOrders = orders.filter(
                  (order) => order.tableSessionId === table.id && order.status !== "complete"
                );

                return (
                  <article
                    className={selectedTableIdResolved === table.id ? "table-card selected" : "table-card"}
                    key={table.id}
                  >
                    <button className="table-card-button" type="button" onClick={() => setSelectedTableId(table.id)}>
                      <span className="active-dot" aria-hidden="true" />
                      <strong>Table {table.tableNumber}</strong>
                      <span>{table.guestCount} guests</span>
                      <small>{table.code}</small>
                    </button>
                    <ul>
                      {tableOrders.slice(0, 3).map((order) => (
                        <li key={order.id}>
                          {order.customer.name}: {order.items[0]?.quantity}x {order.items[0]?.name}
                        </li>
                      ))}
                      {tableOrders.length > 3 ? <li>+ {tableOrders.length - 3} more</li> : null}
                    </ul>
                    <div className="table-card-actions">
                      <button className="ghost-button" type="button" onClick={() => setSelectedTableId(table.id)}>
                        View Details
                      </button>
                      <button className="accent-button" type="button" onClick={() => setSelectedTableId(table.id)}>
                        Send Love
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <aside className="order-drawer">
            {selectedTable ? (
              <>
                <div className="drawer-heading">
                  <div>
                    <p className="eyebrow">table detail</p>
                    <h2>Table {selectedTable.tableNumber}</h2>
                    <small>
                      Last active {formatDistanceToNow(new Date(selectedTable.lastActiveAt), { addSuffix: true })}
                    </small>
                  </div>
                  <button className="danger-button" type="button" onClick={closeSelectedTable}>
                    <DoorClosed size={16} />
                    Close Table
                  </button>
                </div>

                <div className="detail-list">
                  {selectedOrders.length === 0 ? (
                    <p>No active orders for this table.</p>
                  ) : (
                    selectedOrders.map((order) => (
                      <article className="detail-order" key={order.id}>
                        <header>
                          <strong>{order.customer.name}</strong>
                          <StatusBadge status={order.status} />
                        </header>
                        {order.items.map((item) => (
                          <div className="detail-line" key={`${order.id}-${item.name}`}>
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <strong>{formatMoney(item.quantity * item.price)}</strong>
                          </div>
                        ))}
                        <button className="accent-button" type="button" onClick={() => markOrderComplete(order.id)}>
                          <CheckCircle2 size={16} />
                          Mark as Complete
                        </button>
                      </article>
                    ))
                  )}
                </div>

                <section className="love-panel">
                  <div className="section-heading compact">
                    <MessageCircleHeart size={22} />
                    <div>
                      <h3>Love Messages</h3>
                      <p>Persisted for current and future table guests.</p>
                    </div>
                  </div>
                  <div className="template-grid">
                    {messageTemplates.map((template) => (
                      <button
                        className="chip"
                        key={template}
                        type="button"
                        disabled={isSending}
                        onClick={() => sendMessage(template)}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                  <label htmlFor="custom-message">Custom message</label>
                  <textarea
                    id="custom-message"
                    maxLength={200}
                    value={customMessage}
                    onChange={(event) => setCustomMessage(event.target.value)}
                    placeholder="Type up to 200 characters"
                  />
                  <div className="message-row">
                    <span>{customMessage.length}/200</span>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={isSending || customMessage.trim().length === 0}
                      onClick={() => sendMessage(customMessage)}
                    >
                      <Send size={16} />
                      {isSending ? "Sending..." : "Send"}
                    </button>
                  </div>
                  <ul className="message-log">
                    {tableMessages.map((message) => (
                      <li key={message.id}>
                        {message.body}{" "}
                        <small>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</small>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : (
              <p>Select an active table to manage orders.</p>
            )}
          </aside>
        </section>
      )}

      <section className="archive-section" id="archive">
        <div className="section-heading compact">
          <Archive size={22} />
          <div>
            <h2>Completed and Closed History</h2>
            <p>Completed customer orders stay visible here for staff review.</p>
          </div>
        </div>
        <div className="archive-grid">
          {completedOrders.map((order) => (
            <article className="archive-card" key={order.id}>
              <strong>{order.customer.name}</strong>
              <span>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</span>
              <StatusBadge status="complete" />
            </article>
          ))}
          {closedTables.map((table) => (
            <article className="archive-card" key={table.id}>
              <strong>Table {table.tableNumber}</strong>
              <span>Manually closed by staff</span>
              <StatusBadge status="complete" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
