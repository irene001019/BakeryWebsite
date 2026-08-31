"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/lib/supabaseClient";

function DeliveryPageInner() {
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupTimeWindow, setPickupTimeWindow] = useState("");
  const [savingPickup, setSavingPickup] = useState(false);

  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState({ name: "", price: "", maxKm: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    const [{ data: settingsData }, { data: zoneData, error: zoneError }] = await Promise.all([
      supabase.from("settings").select("pickup_location, pickup_time_window").single(),
      supabase.from("delivery_zones").select("*").order("sort_order"),
    ]);
    setPickupLocation(settingsData?.pickup_location || "");
    setPickupTimeWindow(settingsData?.pickup_time_window || "");
    if (zoneError) setError(zoneError.message);
    setZones(zoneData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSavePickup(e) {
    e.preventDefault();
    setSavingPickup(true);
    const { error } = await supabase
      .from("settings")
      .update({ pickup_location: pickupLocation, pickup_time_window: pickupTimeWindow })
      .eq("id", true);
    if (error) setError(error.message);
    setSavingPickup(false);
  }

  async function handleAddZone(e) {
    e.preventDefault();
    if (!newZone.name.trim() || newZone.price === "") return;
    const nextSort = zones.length ? Math.max(...zones.map((z) => z.sort_order)) + 1 : 0;
    const { error } = await supabase.from("delivery_zones").insert({
      name: newZone.name.trim(),
      price_cents: Math.round(parseFloat(newZone.price) * 100),
      max_km: newZone.maxKm ? parseFloat(newZone.maxKm) : null,
      sort_order: nextSort,
    });
    if (error) setError(error.message);
    else {
      setNewZone({ name: "", price: "", maxKm: "" });
      loadAll();
    }
  }

  async function handleToggleActive(zone) {
    const { error } = await supabase
      .from("delivery_zones")
      .update({ is_active: !zone.is_active })
      .eq("id", zone.id);
    if (error) setError(error.message);
    else loadAll();
  }

  async function handleDeleteZone(zone) {
    if (!confirm(`Delete "${zone.name}"?`)) return;
    const { error } = await supabase.from("delivery_zones").delete().eq("id", zone.id);
    if (error) setError(error.message);
    else loadAll();
  }

  async function move(zone, direction) {
    const idx = zones.findIndex((z) => z.id === zone.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= zones.length) return;
    const a = zones[idx];
    const b = zones[swapIdx];
    await supabase.from("delivery_zones").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("delivery_zones").update({ sort_order: a.sort_order }).eq("id", b.id);
    loadAll();
  }

  return (
    <>
      <AdminNav active="/admin/delivery" />
      <main className="max-w-2xl mx-auto p-6 space-y-10">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <section>
          <h1 className="font-display text-2xl text-brand-crust mb-3">Pickup</h1>
          <form onSubmit={handleSavePickup} className="bg-white rounded-lg p-4 shadow-sm space-y-3">
            <div>
              <label className="block text-sm mb-1" htmlFor="pickupLocation">
                Pickup location (shown to customers)
              </label>
              <input
                id="pickupLocation"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Corner of Main St & 3rd Ave"
                className="w-full border border-brand-crust/20 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="pickupWindow">
                Pickup time window
              </label>
              <input
                id="pickupWindow"
                value={pickupTimeWindow}
                onChange={(e) => setPickupTimeWindow(e.target.value)}
                placeholder="e.g. Saturday 11am–2pm"
                className="w-full border border-brand-crust/20 rounded-lg px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={savingPickup}
              className="bg-brand-crust text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {savingPickup ? "Saving…" : "Save pickup info"}
            </button>
          </form>
        </section>

        <section>
          <h1 className="font-display text-2xl text-brand-crust mb-3">Delivery zones</h1>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {zones.map((z, i) => (
                <li key={z.id} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex flex-col text-xs">
                    <button onClick={() => move(z, "up")} disabled={i === 0} className="disabled:opacity-30">▲</button>
                    <button onClick={() => move(z, "down")} disabled={i === zones.length - 1} className="disabled:opacity-30">▼</button>
                  </div>
                  <div className="flex-1">
                    <p className={z.is_active ? "text-brand-crust" : "text-brand-crust/40 line-through"}>
                      {z.name}
                    </p>
                    <p className="text-xs text-brand-crust/50">
                      ${(z.price_cents / 100).toFixed(2)}
                      {z.max_km ? ` · up to ${z.max_km}km` : ""}
                    </p>
                  </div>
                  <button onClick={() => handleToggleActive(z)} className="text-sm text-brand-crust/60">
                    {z.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDeleteZone(z)} className="text-sm text-red-500">
                    Delete
                  </button>
                </li>
              ))}
              {zones.length === 0 && (
                <p className="text-sm text-brand-crust/50">No zones yet — add one below.</p>
              )}
            </ul>
          )}
          <form onSubmit={handleAddZone} className="bg-white rounded-lg p-4 shadow-sm flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs mb-1">Zone name</label>
              <input
                value={newZone.name}
                onChange={(e) => setNewZone((z) => ({ ...z, name: e.target.value }))}
                placeholder="e.g. Zone A (10–13km)"
                className="w-full border border-brand-crust/20 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newZone.price}
                onChange={(e) => setNewZone((z) => ({ ...z, price: e.target.value }))}
                className="w-full border border-brand-crust/20 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs mb-1">Up to (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={newZone.maxKm}
                onChange={(e) => setNewZone((z) => ({ ...z, maxKm: e.target.value }))}
                className="w-full border border-brand-crust/20 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-crust text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              Add zone
            </button>
          </form>
          <p className="text-xs text-brand-crust/40 mt-2">
            Per the project spec, keep zones within a 15km max range. Orders beyond that are
            handled manually (customers are shown a "contact us" note for $95+ orders).
          </p>
        </section>
      </main>
    </>
  );
}

export default function DeliveryPage() {
  return (
    <AdminGuard>
      <DeliveryPageInner />
    </AdminGuard>
  );
}
