"use client";

import { ClipboardList, Coffee } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/menu", label: "Menu", icon: Coffee },
  { href: "/orders", label: "Orders", icon: ClipboardList }
];

export function PageTabs() {
  const pathname = usePathname();

  return (
    <div className="page-tabs" role="tablist" aria-label="Page navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={`page-tab ${active ? "active" : ""}`}
          >
            <Icon size={18} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
