"use client";

import { CheckCircle2, FileImage, GripVertical, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, useState } from "react";

import { formatMoney } from "@/lib/utils";
import type { ParsedMenuItem } from "@/types/brewboard";

export default function MenuBuilderPage() {
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [items, setItems] = useState<ParsedMenuItem[]>([]);
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Each image must be 10 MB or smaller.");
      return;
    }

    setError("");
    setStep("processing");

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setError("Could not read the menu image.");
        setStep("upload");
        return;
      }

      const base64 = result.split(",")[1];

      if (!base64) {
        setError("Could not read the menu image.");
        setStep("upload");
        return;
      }

      try {
        const response = await fetch("/api/gemini/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type || "image/jpeg" })
        });
        const body = (await response.json()) as { items?: ParsedMenuItem[]; error?: string };

        if (!response.ok || !body.items?.length) {
          throw new Error(body.error ?? "Menu extraction failed.");
        }

        setItems(body.items);
        setStep("review");
      } catch (extractError) {
        setError(extractError instanceof Error ? extractError.message : "Menu extraction failed.");
        setStep("upload");
      }
    };

    reader.readAsDataURL(file);
  }

  async function publishMenu() {
    setIsPublishing(true);
    setError("");

    const response = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          accent: item.accent,
          imageUrl: item.imageUrl ?? ""
        }))
      })
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(body.error ?? "Could not publish the menu.");
      setIsPublishing(false);
      return;
    }

    setIsPublishing(false);
    setStep("upload");
    setItems([]);
  }

  function updateItem(id: string, patch: Partial<ParsedMenuItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch, flagged: false } : item)));
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">ai menu builder</p>
          <h1>Publish the digital menu</h1>
        </div>
        <span className="ai-pill">
          <Sparkles size={18} />
          Smart scanning verification
        </span>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      {step === "upload" ? (
        <section className="builder-layout">
          <div className="upload-zone">
            <UploadCloud size={56} />
            <h2>Upload your menu photo(s)</h2>
            <p>JPG, PNG, HEIC - max 10 MB per image.</p>
            <label className="primary-button lavender-button" htmlFor="menu-upload">
              <Sparkles size={18} />
              Extract Menu with AI
            </label>
            <input
              id="menu-upload"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>
          <aside className="builder-note">
            <FileImage size={34} />
            <h3>What happens next</h3>
            <p>
              The system scans the menu image, identifies names, categories, and prices, and flags any potential discrepancies for your final review.
            </p>
          </aside>
        </section>
      ) : null}

      {step === "processing" ? (
        <section className="processing-panel" aria-live="polite">
          <Sparkles size={54} />
          <h2>Reading and verifying...</h2>
          <div className="progress-row">
            <span>Scanning physical menu</span>
            <div>
              <i />
            </div>
          </div>
          <div className="progress-row delay">
            <span>Optimizing digital list</span>
            <div>
              <i />
            </div>
          </div>
        </section>
      ) : null}


      {step === "review" ? (
        <section className="review-panel">
          <div className="section-heading compact">
            <CheckCircle2 size={24} />
            <div>
              <h2>Review extracted menu</h2>
              <p>Flagged rows need a human check before publishing.</p>
            </div>
          </div>
          <div className="menu-editor">
            {items.map((item) => (
              <article className={item.flagged ? "editor-row flagged" : "editor-row"} key={item.id}>
                <GripVertical size={18} />
                <input
                  aria-label="Category"
                  value={item.category}
                  onChange={(event) => updateItem(item.id, { category: event.target.value })}
                />
                <input
                  aria-label="Item name"
                  value={item.name}
                  onChange={(event) => updateItem(item.id, { name: event.target.value })}
                />
                <input
                  aria-label="Description"
                  value={item.description}
                  onChange={(event) => updateItem(item.id, { description: event.target.value })}
                />
                <input
                  aria-label="Price"
                  type="number"
                  value={item.price}
                  onChange={(event) => updateItem(item.id, { price: Number(event.target.value) })}
                />
                {item.flagged ? (
                  <span className="review-badge">Review</span>
                ) : (
                  <span className="review-badge ok">Accepted</span>
                )}
                <button
                  className="icon-button ghost"
                  type="button"
                  onClick={() => setItems((current) => current.filter((draftItem) => draftItem.id !== item.id))}
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
          <div className="publish-bar">
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  {
                    id: `manual-${Date.now()}`,
                    name: "New Item",
                    description: "",
                    price: 0,
                    category: "Cafe",
                    accent: "caramel",
                    flagged: false
                  }
                ])
              }
            >
              Add Item
            </button>
            <button className="primary-button" type="button" onClick={publishMenu} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish Menu"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
