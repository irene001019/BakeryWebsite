"use client";

import { createContext, useContext, useState, useMemo } from "react";

const CartContext = createContext(null);

// Holds the customer's in-progress order while they browse the menu.
// Deliberately just React state (not localStorage/a database) — the
// cart only needs to survive while this tab is open. It gets written
// to the database for real in Phase 5 (order submission).
export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);

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

  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
    [lines]
  );

  const value = { lines, addLine, removeLine, updateQuantity, subtotalCents };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
