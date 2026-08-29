"use client";

import { useCart } from "@/lib/cartContext";

export default function CartPanel() {
  const { lines, removeLine, updateQuantity, subtotalCents } = useCart();

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
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-brand-latte/30">
        <span className="font-display text-lg text-brand-ink">Subtotal</span>
        <span className="font-display text-lg text-brand-ink">
          ${(subtotalCents / 100).toFixed(2)}
        </span>
      </div>
      <p className="text-[11px] text-brand-ink/40 mt-2">
        Pickup/delivery and checkout are coming in the next build phase.
      </p>
    </aside>
  );
}
