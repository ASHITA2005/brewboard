"use client";

import { CheckCircle2, FileImage, GripVertical, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, useState } from "react";

import type { ParsedMenuItem } from "@/types/brewboard";

type UploadedImage = {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
};

function compressImage(file: File): Promise<{ base64: string; mimeType: string; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Downscale to max 1600px width/height while maintaining aspect ratio
        const MAX_SIZE = 1600;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context creation failed"));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 0.80 quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          reject(new Error("Image compression failed"));
          return;
        }

        resolve({
          base64,
          mimeType: "image/jpeg",
          name: file.name
        });
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsDataURL(file);
  });
}

export default function MenuBuilderPage() {
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [items, setItems] = useState<ParsedMenuItem[]>([]);
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError("");

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError("Each image must be 10 MB or smaller.");
        return;
      }
      validFiles.push(file);
    }

    try {
      const results = await Promise.all(validFiles.map(compressImage));
      const newImages = results.map((r, idx) => ({
        id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
        name: r.name,
        base64: r.base64,
        mimeType: r.mimeType
      }));
      setUploadedImages((current) => [...current, ...newImages]);
    } catch (err) {
      setError("Could not read one or more menu images.");
    }
  }

  async function handleStartExtraction() {
    if (uploadedImages.length === 0) return;

    setStep("processing");
    setError("");

    try {
      const extractionPromises = uploadedImages.map(async (image, imgIndex) => {
        const response = await fetch("/api/gemini/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: image.base64, mimeType: image.mimeType })
        });

        const body = (await response.json()) as { items?: ParsedMenuItem[]; error?: string };

        if (!response.ok || !body.items?.length) {
          throw new Error(body.error ?? `Extraction failed for ${image.name}.`);
        }

        // Map unique draft IDs to prevent duplicate keys in the grid
        return body.items.map((item, itemIndex) => ({
          ...item,
          id: `${item.id}-${imgIndex}-${itemIndex}`
        }));
      });

      const results = await Promise.all(extractionPromises);
      const allItems = results.flat();

      setItems(allItems);
      setStep("review");
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "Menu extraction failed.");
      setStep("upload");
    }
  }

  async function publishMenu() {
    const confirmed = window.confirm(
      "Publishing a new menu will automatically close all active table sessions and mark pending customer orders as complete. Are you sure you want to proceed?"
    );
    if (!confirmed) return;

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
    setUploadedImages([]);
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
        <section className="builder-layout" style={{ display: "grid", gap: "24px" }}>
          <div className="upload-zone" style={{ padding: "32px 24px" }}>
            <UploadCloud size={56} />
            <h2>Upload your menu photo(s)</h2>
            <p style={{ marginBottom: "16px" }}>JPG, PNG, HEIC - max 10 MB per image. Select multiple to scan them together.</p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <label className="primary-button lavender-button" htmlFor="menu-upload" style={{ cursor: "pointer" }}>
                <UploadCloud size={18} style={{ marginRight: "8px" }} />
                Select Photo(s)
              </label>
              <input
                id="menu-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/heic,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />

              {uploadedImages.length > 0 ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleStartExtraction}
                  style={{ background: "var(--ink)", color: "white" }}
                >
                  <Sparkles size={18} style={{ marginRight: "8px" }} />
                  Extract Menu with AI ({uploadedImages.length})
                </button>
              ) : null}
            </div>

            {uploadedImages.length > 0 ? (
              <div style={{ marginTop: "24px" }}>
                <p className="eyebrow" style={{ textAlign: "left", marginBottom: "8px" }}>Selected Photos ({uploadedImages.length})</p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "12px",
                    width: "100%"
                  }}
                >
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      style={{
                        position: "relative",
                        border: "2px solid var(--ink)",
                        borderRadius: "12px",
                        overflow: "hidden",
                        aspectRatio: "1",
                        background: "white",
                        boxShadow: "2px 2px 0 var(--ink)"
                      }}
                    >
                      <img
                        src={`data:${image.mimeType};base64,${image.base64}`}
                        alt={image.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        onClick={() => setUploadedImages((current) => current.filter((img) => img.id !== image.id))}
                        type="button"
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "#c44",
                          color: "white",
                          border: "1.5px solid var(--ink)",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "10px"
                        }}
                        aria-label={`Remove ${image.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedImages([])}
                  style={{
                    marginTop: "16px",
                    color: "#c44",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    textDecoration: "underline"
                  }}
                >
                  Clear all photos
                </button>
              </div>
            ) : null}
          </div>

          <aside className="builder-note" style={{ height: "fit-content" }}>
            <FileImage size={34} />
            <h3>Multi-Photo Support</h3>
            <p>
              You can now select multiple images at once (or click Select Photo(s) again to add more). Once uploaded, clicking "Extract Menu with AI" will scan all photos in parallel and merge their menu items into a single review list.
            </p>
          </aside>
        </section>
      ) : null}

      {step === "processing" ? (
        <section className="processing-panel" aria-live="polite">
          <Sparkles size={54} />
          <h2>Reading and verifying...</h2>
          <div className="progress-row">
            <span>Scanning physical menus</span>
            <div>
              <i />
            </div>
          </div>
          <div className="progress-row delay">
            <span>Merging digital lists</span>
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
