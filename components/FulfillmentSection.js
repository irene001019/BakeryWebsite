"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/lib/cartContext";
import DeliveryZoneMap from "@/components/DeliveryZoneMap";

// $95 manual-contact threshold and 15km max range come from the
// project spec (Section D) — shown here as a static note since actual
// address-based zone lookup is a parked Phase 2 feature, not V1.
const OUTSIDE_ZONE_MIN_ORDER = 95;

export default function FulfillmentSection() {
  const { fulfillmentType, chooseFulfillment, deliveryZone, setDeliveryZone, subtotalCents } =
    useCart();

  const [zones, setZones] = useState([]);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupTimeWindow, setPickupTimeWindow] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOutsideZoneNote, setShowOutsideZoneNote] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: zoneData }, { data: settingsData }] = await Promise.all([
        supabase.from("delivery_zones").select("*").order("sort_order"),
        supabase.from("settings").select("pickup_location, pickup_time_window").single(),
      ]);
      setZones(zoneData || []);
      setPickupLocation(settingsData?.pickup_location || "");
      setPickupTimeWindow(settingsData?.pickup_time_window || "");
      setLoading(false);
    }
    load();
  }, []);

  function handleSelectZone(zoneId) {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) setDeliveryZone(zone);
  }

  const maxRangeKm = zones.length
    ? Math.max(...zones.map((z) => z.max_km || 0))
    : null;

  return (
    <section className="bg-brand-paper rounded-2xl shadow-sm p-6 mt-10">
      <h2 className="font-display text-2xl text-brand-ink mb-4">Pickup or delivery?</h2>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => chooseFulfillment("pickup")}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
            fulfillmentType === "pickup"
              ? "bg-brand-ink text-brand-cream border-brand-ink"
              : "border-brand-latte text-brand-ink/70 hover:border-brand-ink"
          }`}
        >
          Pickup
        </button>
        <button
          type="button"
          onClick={() => chooseFulfillment("delivery")}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
            fulfillmentType === "delivery"
              ? "bg-brand-ink text-brand-cream border-brand-ink"
              : "border-brand-latte text-brand-ink/70 hover:border-brand-ink"
          }`}
        >
          Delivery
        </button>
      </div>

      {loading && <p className="text-sm text-brand-ink/40">Loading fulfillment options…</p>}

      {!loading && fulfillmentType === "pickup" && (
        <div className="text-sm text-brand-ink/70 space-y-1">
          <p>
            <span className="font-medium text-brand-ink">Pickup location:</span>{" "}
            {pickupLocation || "Not set yet — add this in the admin panel."}
          </p>
          <p>
            <span className="font-medium text-brand-ink">When:</span>{" "}
            {pickupTimeWindow || "Not set yet — add this in the admin panel."}
          </p>
        </div>
      )}

      {!loading && fulfillmentType === "delivery" && (
        <div className="space-y-4">
          {zones.length === 0 ? (
            <p className="text-sm text-brand-ink/50">
              No delivery zones are set up yet — add them in the admin panel.
            </p>
          ) : (
            <div className="grid sm:grid-cols-[220px_1fr] gap-6 items-center">
              <DeliveryZoneMap
                zones={zones}
                selectedZoneId={deliveryZone?.id}
                onSelect={handleSelectZone}
              />
              <ul className="space-y-2">
                {zones.map((zone) => (
                  <li key={zone.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectZone(zone.id)}
                      className={`w-full text-left flex justify-between items-center rounded-lg border px-3 py-2 text-sm transition ${
                        deliveryZone?.id === zone.id
                          ? "bg-brand-ink text-brand-cream border-brand-ink"
                          : "border-brand-latte text-brand-ink/70 hover:border-brand-ink"
                      }`}
                    >
                      <span>{zone.name}</span>
                      <span>${(zone.price_cents / 100).toFixed(2)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowOutsideZoneNote((v) => !v)}
            className="text-xs text-brand-ink/50 underline"
          >
            My address might be outside these zones
          </button>
          {showOutsideZoneNote && (
            <p className="text-xs text-brand-ink/50 bg-brand-cream rounded-lg p-3">
              We currently deliver up to about {maxRangeKm || 15}km. If you&apos;re further out
              and your order totals ${OUTSIDE_ZONE_MIN_ORDER}+, contact us directly and we&apos;ll
              see what we can do.
              {subtotalCents / 100 < OUTSIDE_ZONE_MIN_ORDER && (
                <> Your current order is under that minimum, so pickup may be the better option.</>
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
