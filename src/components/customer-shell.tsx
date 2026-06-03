"use client";

import { Coffee, ClipboardList, Home, LogOut, ShoppingBag, Users, Check, AlertCircle, Info, Heart, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback } from "react";

import { useCartStore } from "@/stores/cart.store";
import { useTableStore } from "@/stores/table.store";
import { useToastStore } from "@/stores/toasts.store";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/table", label: "Table", icon: Users },
  { href: "/menu", label: "Menu", icon: Coffee },
  { href: "/orders", label: "Feed", icon: ClipboardList }
];

export function CustomerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.lines.reduce((total, line) => total + line.quantity, 0));
  const { toasts, removeToast } = useToastStore();
  const router = useRouter();
  const setActiveTable = useTableStore((state) => state.setActiveTable);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
    setActiveTable(null);
    router.push("/login");
  }, [router, setActiveTable]);

  return (
    <div className="customer-shell">
      {/* Toast Notification Container */}
      <div className="toast-container" aria-live="assertive">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isInfo = toast.type === "info";
          const isLove = toast.type === "love";

          return (
            <div
              key={toast.id}
              className={`toast-notification ${toast.type} show`}
              role="alert"
            >
              <div className="toast-icon">
                {isSuccess ? <Check size={20} /> : null}
                {isError ? <AlertCircle size={20} /> : null}
                {isInfo ? <Info size={20} /> : null}
                {isLove ? <Heart size={20} fill="currentColor" /> : null}
              </div>
              <div className="toast-content">
                <span className="toast-title">
                  {isSuccess ? "Lovely news!" : null}
                  {isError ? "Oops! Something went wrong" : null}
                  {isInfo ? "Say hello!" : null}
                  {isLove ? "Café Love Message" : null}
                </span>
                <p className="toast-message">{toast.message}</p>
              </div>
              <button
                className="toast-close"
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <header className="top-strip">
        <Link href="/" className="brand-mark" aria-label="BrewBoard home">
          <Home size={22} />
          <span>BrewBoard</span>
        </Link>
        <button className="logout-link" onClick={handleSignOut} aria-label="Sign out">
          <LogOut size={16} />
        </button>
      </header>
      <main className="customer-main">{children}</main>
      <nav className="bottom-nav" aria-label="Customer navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} className={active ? "bottom-nav-item active" : "bottom-nav-item"} href={item.href}>
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link className="bottom-nav-item" href="/menu#cart">
          <span className="cart-nav-icon">
            <ShoppingBag size={22} />
            {itemCount > 0 ? <strong>{itemCount}</strong> : null}
          </span>
          <span>Cart</span>
        </Link>
      </nav>
    </div>
  );
}

