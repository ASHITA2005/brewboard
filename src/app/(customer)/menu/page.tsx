"use client";

import { Image as ImageIcon, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CartPanel } from "@/components/cart-panel";
import { PageTabs } from "@/components/page-tabs";
import { menuItems } from "@/lib/sample-data";
import { formatMoney } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import type { MenuItem } from "@/types/brewboard";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [visualising, setVisualising] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [visuals, setVisuals] = useState<Record<string, string>>({});
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      const response = await fetch("/api/menu");
      const body = (await response.json()) as { items?: MenuItem[] };

      if (!cancelled && body.items?.length) {
        setItems(body.items);
      }
    }

    loadMenu().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        const matchesQuery = `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [activeCategory, items, query]
  );

  async function handleVisualise(item: MenuItem) {
    setVisualising(item.id);
    setVisualError(null);

    try {
      const response = await fetch("/api/gemini/visualise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: item.name, description: item.description })
      });
      const body = (await response.json()) as { imageUrl?: string; error?: string };

      if (!response.ok || !body.imageUrl) {
        throw new Error(body.error ?? "Feature not possible currently. Please try again later.");
      }

      setVisuals((current) => ({ ...current, [item.id]: body.imageUrl ?? "" }));
    } catch (error) {
      setVisualError(error instanceof Error ? error.message : "Feature not possible currently. Please try again later.");
    } finally {
      setVisualising(null);
    }
  }

  return (
    <div className="menu-layout">
      <section className="menu-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">good morning, friend</p>
            <h1>What sounds delicious?</h1>
          </div>
        </div>
        <PageTabs />
        <label className="search-bar">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search coffee, bakes..." />
        </label>
        <div className="chip-row" aria-label="Menu categories">
          {categories.map((category) => (
            <button
              key={category}
              className={category === activeCategory ? "chip active" : "chip"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {visualError ? (
          <div className="toast-banner lavender" role="status">
            <Sparkles size={18} />
            {visualError}
          </div>
        ) : null}

        <div className="menu-grid">
          {filteredItems.map((item) => (
            <article className="menu-card" key={item.id}>
              <div className={`menu-illustration ${item.accent}`}>
                {visualising === item.id ? (
                  <span className="shimmer">Generating...</span>
                ) : visuals[item.id] || item.imageUrl ? (
                  <img src={visuals[item.id] ?? item.imageUrl} alt={item.name} />
                ) : (
                  <ImageIcon size={42} />
                )}
              </div>
              <span className={`category-badge ${item.accent}`}>{item.category}</span>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div className="menu-card-footer">
                <strong>{formatMoney(item.price)}</strong>
                <button className="icon-button" onClick={() => addItem(item)} aria-label={`Add ${item.name}`}>
                  <Plus size={18} />
                </button>
              </div>
              {!item.imageUrl && !visuals[item.id] ? (
                <button className="ai-button" onClick={() => handleVisualise(item)} disabled={visualising === item.id}>
                  <Sparkles size={16} />
                  See how this looks
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      <CartPanel />
    </div>
  );
}
