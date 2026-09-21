"use client";

import { createContext, useContext, useState, useMemo } from "react";

const CartContext = createContext(null);

// Delivery discount tiers, requested directly (not from the original
// spec docs): orders over $50 get $5 off delivery, orders over $70
// get $8 off instead (not stacked — whichever tier applies). Fee never
// goes below $0 regardless of discount size.
function computeDeliveryFeeCents(baseFeeCents, subtotalCents) {
  let discountCents = 0;
  if (subtotalCents > 7000) discountCents = 800;
  else if (subtotalCents > 5000) discountCents = 500;
  return {
    feeCents: Math.max(0, baseFeeCents - discountCents),
    // Capped at the base fee itself, so we never display "$8.00 off" a
    // $5.00 fee that only actually dropped by $5.00.
    discountCents: Math.min(discountCents, baseFeeCents),
  };
}

// Holds the customer's in-progress order while they browse the menu:
// line items (Phase 2) plus fulfillment choice (Phase 4). Deliberately
// just React state (not localStorage/a database) — it only needs to
// survive while this tab is open. It gets written to the database for
// real in Phase 5 (order submission).
export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState(null); // "pickup" | "delivery" | null
  const [deliveryZone, setDeliveryZone] = useState(null); // { id, name, price_cents } | null

  function addLine(line) {
    setLines((prev) => [...prev, { ...line, lineId: crypto.randomUUID() }]);
  }
  function removeLine(lineId) {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }
  function updateQuantity(lineId, quantity) {
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.max(1, quantity) } : l))
    );
  }

  function chooseFulfillment(type) {
    setFulfillmentType(type);
    if (type === "pickup") setDeliveryZone(null);
  }

  function clearCart() {
    setLines([]);
    setFulfillmentType(null);
    setDeliveryZone(null);
  }

  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
    [lines]
  );

  const baseDeliveryFeeCents =
    fulfillmentType === "delivery" && deliveryZone ? deliveryZone.price_cents : 0;

  const { feeCents: deliveryFeeCents, discountCents: deliveryDiscountCents } =
    computeDeliveryFeeCents(baseDeliveryFeeCents, subtotalCents);

  const totalCents = subtotalCents + deliveryFeeCents;

  const value = {
    lines,
    addLine,
    removeLine,
    updateQuantity,
    clearCart,
    subtotalCents,
    fulfillmentType,
    chooseFulfillment,
    deliveryZone,
    setDeliveryZone,
    deliveryFeeCents,
    deliveryDiscountCents,
    totalCents,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
