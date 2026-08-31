"use client";

import { useCart } from "@/lib/cartContext";

export default function CartPanel() {
  const {
    lines,
    removeLine,
    updateQuantity,
    subtotalCents,
    fulfillmentType,
    deliveryZone,
    deliveryFeeCents,
    totalCents,
  } = useCart();

  return (
    <aside className="bg-brand-paper rounded-2xl shadow-sm p-5 md:sticky md:top-6 h-fit">
      <h2 className="font-display text-xl text-brand-ink mb-3">Your order</h2>
      {lines.length === 0 ? (
        <p className="text-sm text-brand-ink/50">
          Nothing added yet — pick something from this weekend&apos;s bake.
        </p>
      ) : (
        <ul className="space-y-3">
          {lines.map((l) => (
            <li
              key={l.lineId}
              className="flex justify-between gap-2 text-sm border-b border-brand-latte/20 pb-3"
            >
              <div className="flex-1">
                <p className="text-brand-ink">
                  {l.itemName} <span className="text-brand-ink/50">— {l.variantLabel}</span>
                </p>
                {l.addonLabel && <p className="text-xs text-brand-ink/50">{l.addonLabel}</p>}
                {l.messageText && (
                  <p className="text-xs text-brand-ink/50">✎ &ldquo;{l.messageText}&rdquo;</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateQuantity(l.lineId, l.quantity - 1)}
                    className="text-brand-ink/50 w-5"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{l.quantity}</span>
                  <button
                    onClick={() => updateQuantity(l.lineId, l.quantity + 1)}
                    className="text-brand-ink/50 w-5"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeLine(l.lineId)}
                    className="text-xs text-red-500 ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-brand-ink font-medium whitespace-nowrap">
                ${((l.unitPriceCents * l.quantity) / 100).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 pt-3 border-t border-brand-latte/30 space-y-1">
        <div className="flex justify-between items-center text-sm text-brand-ink/60">
          <span>Subtotal</span>
          <span>${(subtotalCents / 100).toFixed(2)}</span>
        </div>
        {fulfillmentType === "pickup" && (
          <div className="flex justify-between items-center text-sm text-brand-ink/60">
            <span>Pickup</span>
            <span>Free</span>
          </div>
        )}
        {fulfillmentType === "delivery" && (
          <div className="flex justify-between items-center text-sm text-brand-ink/60">
            <span>Delivery{deliveryZone ? ` — ${deliveryZone.name}` : ""}</span>
            <span>
              {deliveryZone ? `$${(deliveryFeeCents / 100).toFixed(2)}` : "Select a zone"}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1">
          <span className="font-display text-lg text-brand-ink">Total</span>
          <span className="font-display text-lg text-brand-ink">
            ${(totalCents / 100).toFixed(2)}
          </span>
        </div>
      </div>
      {!fulfillmentType && (
        <p className="text-[11px] text-brand-ink/40 mt-2">
          Choose pickup or delivery below to see your full total.
        </p>
      )}
    </aside>
  );
}
