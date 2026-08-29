"use client";

import { useState } from "react";
import { useCart } from "@/lib/cartContext";

export default function MenuItemCard({ item }) {
  const { addLine } = useCart();

  const variants = item.menu_item_variants?.length
    ? [...item.menu_item_variants].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const addons = item.menu_item_addons?.length
    ? [...item.menu_item_addons].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const [variantId, setVariantId] = useState(variants[0]?.id || "");
  const [addonId, setAddonId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wantsMessage, setWantsMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageStyle, setMessageStyle] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.id === variantId);
  const selectedAddon = addons.find((a) => a.id === addonId);
  const unitPriceCents =
    (selectedVariant?.price_cents || 0) + (selectedAddon?.price_delta_cents || 0);

  function handleAdd() {
    if (!selectedVariant) return;
    addLine({
      itemId: item.id,
      itemName: item.name,
      variantId: selectedVariant.id,
      variantLabel: selectedVariant.label,
      addonId: selectedAddon?.id || null,
      addonLabel: selectedAddon?.label || null,
      unitPriceCents,
      quantity,
      messageText: wantsMessage ? messageText.trim() : "",
      messageStyle: wantsMessage ? messageStyle.trim() : "",
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    setQuantity(1);
    setWantsMessage(false);
    setMessageText("");
    setMessageStyle("");
  }

  return (
    <div className="bg-brand-paper rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {item.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo_url} alt={item.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-brand-latte/20" />
      )}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-display text-xl text-brand-ink">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-brand-ink/60 mt-1">{item.description}</p>
          )}
        </div>

        {variants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  variantId === v.id
                    ? "bg-brand-ink text-brand-cream border-brand-ink"
                    : "border-brand-latte text-brand-ink/70 hover:border-brand-ink"
                }`}
              >
                {v.label} · ${(v.price_cents / 100).toFixed(2)}
              </button>
            ))}
          </div>
        )}

        {addons.length > 0 && (
          <div>
            <label className="text-xs text-brand-ink/60 block mb-1" htmlFor={`addon-${item.id}`}>
              Flavor
            </label>
            <select
              id={`addon-${item.id}`}
              value={addonId}
              onChange={(e) => setAddonId(e.target.value)}
              className="w-full text-sm border border-brand-latte rounded-lg px-2 py-1.5 bg-brand-paper"
            >
              <option value="">No preference</option>
              {addons.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                  {a.price_delta_cents ? ` (+$${(a.price_delta_cents / 100).toFixed(2)})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {item.message_eligible && (
          <div className="border-t border-brand-latte/30 pt-3">
            <label className="flex items-center gap-2 text-xs text-brand-ink/70">
              <input
                type="checkbox"
                checked={wantsMessage}
                onChange={(e) => setWantsMessage(e.target.checked)}
              />
              Add a handwritten message (free)
            </label>
            {wantsMessage && (
              <div className="mt-2 space-y-2">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="e.g. Happy Birthday, Mei!"
                  maxLength={60}
                  className="w-full text-sm border border-brand-latte rounded-lg px-2 py-1.5"
                />
                <input
                  value={messageStyle}
                  onChange={(e) => setMessageStyle(e.target.value)}
                  placeholder="Color/style preference (optional)"
                  maxLength={40}
                  className="w-full text-sm border border-brand-latte rounded-lg px-2 py-1.5"
                />
                <p className="text-[11px] text-brand-ink/40">
                  Handwritten only — no fondant or edible image printing.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center border border-brand-latte rounded-full">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 text-brand-ink/70"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 text-brand-ink/70"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedVariant}
            className="bg-brand-ink text-brand-cream text-sm rounded-full px-4 py-2 disabled:opacity-40"
          >
            {justAdded ? "Added ✓" : `Add · $${((unitPriceCents * quantity) / 100).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
