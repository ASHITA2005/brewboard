"use client";

import { Archive, Coffee, LayoutDashboard, LogOut, WandSparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin/dashboard", label: "Orders", icon: LayoutDashboard },
  { href: "/admin/menu-builder", label: "Menu Builder", icon: WandSparkles },
  { href: "/admin/dashboard#archive", label: "Archive", icon: Archive }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          <Coffee size={28} />
          <span>BrewBoard</span>
        </Link>
        <nav aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href.split("#")[0];
            return (
              <Link key={item.href} href={item.href} className={active ? "admin-nav-item active" : "admin-nav-item"}>
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button className="admin-nav-item logout" type="button" onClick={handleLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
