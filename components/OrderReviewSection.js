"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/lib/cartContext";
import { useFetchCutoffStatus } from "@/lib/useFetchCutoffStatus";

export default function OrderReviewSection() {
  const {
    lines,
    fulfillmentType,
    deliveryZone,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    clearCart,
  } = useCart();
  const fetchCutoffStatus = useFetchCutoffStatus();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [policyAck, setPolicyAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const cartEmpty = lines.length === 0;
  const needsAddress = fulfillmentType === "delivery";
  const readyToSubmit =
    !cartEmpty &&
    fulfillmentType &&
    (!needsAddress || address.trim()) &&
    (fulfillmentType !== "delivery" || deliveryZone) &&
    name.trim() &&
    phone.trim() &&
    email.trim() &&
    policyAck;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!readyToSubmit || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      // Re-check the cutoff right before writing, using a fresh
      // server-timestamped fetch — not whatever was true when the page
      // first loaded. A customer could have had this tab open for
      // hours, well past a cutoff that's since rolled the weekend
      // forward.
      const status = await fetchCutoffStatus();
      if (status.correctedNowMs() >= status.cutoffAtMs) {
        setError(
          "Ordering just closed for this weekend. Please refresh the page — we're now taking orders for next weekend instead."
        );
        setSubmitting(false);
        return;
      }
      const { year, month, day } = status.weekendStart;
      const weekendDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Generated client-side (rather than relying on the database's
      // default) so we can use it to insert order_items right after,
      // with no read-back needed — customers don't have SELECT access
      // to the orders table by design (see schema.sql), and reading
      // back an INSERT's RETURNING is subject to that same SELECT
      // policy in Postgres, so a read-back would come back empty anyway.
      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        customer_name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        fulfillment_type: fulfillmentType,
        delivery_zone_id: fulfillmentType === "delivery" ? deliveryZone.id : null,
        delivery_address: fulfillmentType === "delivery" ? address.trim() : null,
        weekend_date: weekendDate,
        subtotal_cents: subtotalCents,
        delivery_fee_cents: deliveryFeeCents,
        total_cents: totalCents,
        notes: notes.trim() || null,
        cancellation_policy_ack: true,
      });
      if (orderError) throw orderError;

      const itemRows = lines.map((l) => ({
        order_id: orderId,
        menu_item_id: l.itemId,
        variant_id: l.variantId,
        addon_id: l.addonId,
        item_name_snapshot: l.itemName,
        variant_label_snapshot: l.variantLabel,
        addon_label_snapshot: l.addonLabel,
        unit_price_cents: l.unitPriceCents,
        quantity: l.quantity,
        message_text: l.messageText || null,
        message_style: l.messageStyle || null,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
      if (itemsError) throw itemsError;

      const weekendLabel = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });

      setConfirmedOrder({
        name: name.trim(),
        email: email.trim(),
        totalCents,
        weekendLabel,
        itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      });
      clearCart();
    } catch (err) {
      setError(err.message || "Something went wrong submitting your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <section className="bg-brand-paper rounded-2xl shadow-sm p-6 mt-10 text-center">
        <h2 className="font-display text-2xl text-brand-ink mb-2">Thank you, {confirmedOrder.name}! 🎂</h2>
        <p className="text-sm text-brand-ink/70">
          Your order for the weekend of {confirmedOrder.weekendLabel} is in —{" "}
          {confirmedOrder.itemCount} item{confirmedOrder.itemCount === 1 ? "" : "s"}, $
          {(confirmedOrder.totalCents / 100).toFixed(2)} total.
        </p>
        <p className="text-xs text-brand-ink/50 mt-2">
          We&apos;ll be in touch at {confirmedOrder.email} to confirm. Payment is cash or
          e-Transfer, arranged at pickup/delivery.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-brand-paper rounded-2xl shadow-sm p-6 mt-10">
      <h2 className="font-display text-2xl text-brand-ink mb-4">Your details</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm mb-1" htmlFor="name">Name</label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-brand-latte rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1" htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-brand-latte rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-brand-latte rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {needsAddress && (
          <div>
            <label className="block text-sm mb-1" htmlFor="address">Delivery address</label>
            <input
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, unit if applicable"
              className="w-full border border-brand-latte rounded-lg px-3 py-2"
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1" htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-brand-latte rounded-lg px-3 py-2"
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-brand-ink/70">
          <input
            type="checkbox"
            checked={policyAck}
            onChange={(e) => setPolicyAck(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I understand orders cannot be cancelled after the Friday cutoff, and that payment is
            by cash or e-Transfer, arranged at pickup/delivery.
          </span>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {cartEmpty && (
          <p className="text-xs text-brand-ink/40">Add something from the menu above to order.</p>
        )}
        {!cartEmpty && !fulfillmentType && (
          <p className="text-xs text-brand-ink/40">Choose pickup or delivery above first.</p>
        )}

        <button
          type="submit"
          disabled={!readyToSubmit || submitting}
          className="w-full bg-brand-ink text-brand-cream rounded-full py-3 font-medium disabled:opacity-40"
        >
          {submitting ? "Submitting…" : `Place order · $${(totalCents / 100).toFixed(2)}`}
        </button>
      </form>
    </section>
  );
}
