"use client";

import { Check, CreditCard, Minus, Plus, QrCode, ShoppingBag, Smartphone, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthUser } from "@/hooks/use-auth-user";
import { formatMoney } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { useTableStore } from "@/stores/table.store";
import { useToastStore } from "@/stores/toasts.store";

export function CartPanel() {
  const router = useRouter();
  const { lines, setQuantity, removeItem, clear } = useCartStore();
  const { user } = useAuthUser();
  const activeTable = useTableStore((state) => state.activeTable);
  const customerName = useTableStore((state) => state.customerName);
  const addToast = useToastStore((state) => state.addToast);
  const customerAvatar =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success">("idle");

  const subtotal = lines.reduce((total, line) => total + line.item.price * line.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  async function placeOrder() {
    if (!activeTable) {
      setMessage("Create or join a table before placing an order.");
      router.push("/table");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableSessionId: activeTable.id,
          customerName,
          items: lines.map((line) => ({
            name: line.item.name,
            quantity: line.quantity,
            price: line.item.price
          }))
        })
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Could not place your order.");
      }

      clear();
      addToast("Order placed successfully! Preparing your coffee...", "success");
      router.push("/orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not place your order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCheckoutClick() {
    if (!activeTable) {
      setMessage("Create or join a table before placing an order.");
      router.push("/table");
      return;
    }
    setIsPaymentOpen(true);
    setPaymentState("idle");
    setPaymentMethod("card");
  }

  async function simulatePayment() {
    setPaymentState("processing");

    // Wait 1.5s to simulate payment authorization
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setPaymentState("success");

    // Wait 1.2s to show success state
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsPaymentOpen(false);
    setPaymentState("idle");

    // Submit order to API
    await placeOrder();
  }


  return (
    <aside className="cart-panel" id="cart" aria-label="Current cart">
      <div className="section-heading compact">
        <ShoppingBag size={22} />
        <div>
          <h2>Your Order</h2>
          <p>Personal cart for this table.</p>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="empty-state small">
          <p>Your cart is waiting for something lovely.</p>
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {lines.map((line) => (
              <div className="cart-line" key={line.item.id}>
                <div>
                  <strong>{line.item.name}</strong>
                  <span>{formatMoney(line.item.price)}</span>
                </div>
                <div className="quantity-control" aria-label={`Quantity for ${line.item.name}`}>
                  <button onClick={() => setQuantity(line.item.id, line.quantity - 1)} aria-label="Decrease quantity">
                    <Minus size={14} />
                  </button>
                  <span>{line.quantity}</span>
                  <button onClick={() => setQuantity(line.item.id, line.quantity + 1)} aria-label="Increase quantity">
                    <Plus size={14} />
                  </button>
                </div>
                <button className="icon-button ghost" onClick={() => removeItem(line.item.id)} aria-label="Remove item">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <dl className="cart-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{formatMoney(tax)}</dd>
            </div>
            <div className="total">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>
          {message ? <p className="form-error">{message}</p> : null}
          <button className="primary-button full" onClick={handleCheckoutClick} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Place Order"}
          </button>
          <p className="fine-print">Brew Points preview only. Loyalty is out of scope for v1.</p>
        </>
      )}

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
                  Total Amount to Pay: <strong style={{ fontSize: "22px", display: "block", marginTop: "4px" }}>{formatMoney(total)}</strong>
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
                    onClick={simulatePayment}
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
                <p style={{ color: "rgba(0,0,0,0.6)" }}>Completing your order placement...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
