"use client";

import { Coffee, Plus, Save, Trash2, Undo } from "lucide-react";
import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/utils";
import type { MenuItem } from "@/types/brewboard";

const ACCENT_OPTIONS = [
  { value: "caramel", label: "Caramel" },
  { value: "mint", label: "Mint" },
  { value: "sky", label: "Sky" },
  { value: "blush", label: "Blush" },
  { value: "lavender", label: "Lavender" }
] as const;

export default function LiveMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [originalItems, setOriginalItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadMenu() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/menu", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch menu items.");
      }
      const body = (await response.json()) as { items?: MenuItem[] };
      const fetchedItems = body.items ?? [];
      setItems(JSON.parse(JSON.stringify(fetchedItems)));
      setOriginalItems(JSON.parse(JSON.stringify(fetchedItems)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load live menu.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  function handleFieldChange(id: string, field: keyof MenuItem, value: any) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function handleAddItem() {
    const newItem: MenuItem = {
      id: `manual-${Date.now()}`,
      name: "New Coffee",
      description: "Rich, delicious blend.",
      price: 4.5,
      category: "Coffee",
      accent: "caramel"
    };
    setItems((current) => [...current, newItem]);
  }

  function handleReset() {
    setItems(JSON.parse(JSON.stringify(originalItems)));
    setSuccess(null);
    setError(null);
  }

  async function handleSaveChanges() {
    // Validate inputs
    for (const item of items) {
      if (!item.name.trim()) {
        setError("Item name cannot be empty.");
        return;
      }
      if (!item.category.trim()) {
        setError(`Category for "${item.name}" cannot be empty.`);
        return;
      }
      if (item.price < 0) {
        setError(`Price for "${item.name}" must be non-negative.`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name.trim(),
            description: item.description?.trim() ?? "",
            price: Number(item.price),
            category: item.category.trim(),
            accent: item.accent,
            imageUrl: item.imageUrl ?? ""
          }))
        })
      });

      const body = (await response.json()) as { items?: MenuItem[]; error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to save menu changes.");
      }

      const updatedItems = body.items ?? [];
      setItems(JSON.parse(JSON.stringify(updatedItems)));
      setOriginalItems(JSON.parse(JSON.stringify(updatedItems)));
      setSuccess("Live menu updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save menu changes.");
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges = JSON.stringify(items) !== JSON.stringify(originalItems);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">menu manager</p>
          <h1>Live Menu (Customer View)</h1>
        </div>
        <span className="ai-pill" style={{ background: "var(--color-mint)", color: "#1b4433" }}>
          <Coffee size={18} />
          Active Customer Menu
        </span>
      </header>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success" style={{ color: "green", background: "#e8f8f1", border: "2px solid #25624a", padding: "12px", borderRadius: "12px", margin: "12px 0", fontWeight: "bold" }}>{success}</p> : null}

      {isLoading ? (
        <p className="landing-card" style={{ padding: "24px", textAlign: "center" }}>Loading live menu...</p>
      ) : (
        <section className="review-panel">
          <div className="section-heading compact">
            <Coffee size={24} />
            <div>
              <h2>Edit Active Menu Items</h2>
              <p>Edits made here update the customer-end menu directly, preserving open customer table sessions.</p>
            </div>
          </div>

          <div className="menu-editor" style={{ marginTop: "16px" }}>
            {items.length === 0 ? (
              <p style={{ padding: "24px", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                No active items. Add a new item to get started!
              </p>
            ) : (
              items.map((item) => (
                <article
                  className="editor-row"
                  key={item.id}
                  style={{
                    borderLeft: `8px solid var(--color-${item.accent})`,
                    paddingLeft: "8px",
                    borderRadius: "4px"
                  }}
                >
                  {/* Category */}
                  <input
                    aria-label="Category"
                    value={item.category}
                    onChange={(e) => handleFieldChange(item.id, "category", e.target.value)}
                    placeholder="Category"
                    style={{ border: "2px solid var(--ink)", borderRadius: "8px" }}
                  />

                  {/* Name */}
                  <input
                    aria-label="Item name"
                    value={item.name}
                    onChange={(e) => handleFieldChange(item.id, "name", e.target.value)}
                    placeholder="Name"
                    style={{ border: "2px solid var(--ink)", borderRadius: "8px" }}
                  />

                  {/* Description */}
                  <input
                    aria-label="Description"
                    value={item.description ?? ""}
                    onChange={(e) => handleFieldChange(item.id, "description", e.target.value)}
                    placeholder="Description"
                    style={{ border: "2px solid var(--ink)", borderRadius: "8px" }}
                  />

                  {/* Price */}
                  <input
                    aria-label="Price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => handleFieldChange(item.id, "price", parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    style={{ border: "2px solid var(--ink)", borderRadius: "8px", width: "90px" }}
                  />

                  {/* Accent color picker */}
                  <select
                    aria-label="Accent color"
                    value={item.accent}
                    onChange={(e) => handleFieldChange(item.id, "accent", e.target.value)}
                    style={{
                      border: "2px solid var(--ink)",
                      borderRadius: "8px",
                      background: "white",
                      padding: "8px 10px",
                      minHeight: "40px",
                      cursor: "pointer"
                    }}
                  >
                    {ACCENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Delete button */}
                  <button
                    className="icon-button ghost"
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.name}`}
                    style={{ color: "#c44" }}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))
            )}
          </div>

          <div className="publish-bar" style={{ display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <button className="secondary-button" type="button" onClick={handleReset} disabled={!hasChanges || isSaving}>
                <Undo size={16} style={{ marginRight: "6px" }} />
                Discard
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={handleAddItem}
                disabled={isSaving}
                style={{ marginLeft: "12px" }}
              >
                <Plus size={16} style={{ marginRight: "6px" }} />
                Add Item
              </button>
            </div>

            <button className="primary-button" type="button" onClick={handleSaveChanges} disabled={!hasChanges || isSaving}>
              <Save size={18} style={{ marginRight: "6px" }} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
