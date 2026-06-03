"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
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
          <button className="primary-button full" onClick={placeOrder} disabled={isSubmitting}>
            {isSubmitting ? "Placing..." : "Place Order"}
          </button>
          <p className="fine-print">Brew Points preview only. Loyalty is out of scope for v1.</p>
        </>
      )}
    </aside>
  );
}
