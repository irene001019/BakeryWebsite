"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/lib/supabaseClient";

const STATUS_OPTIONS = ["received", "confirmed", "ready", "fulfilled", "cancelled"];

function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function OrdersPageInner() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [itemsByOrder, setItemsByOrder] = useState({});

  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: !sortNewestFirst });
    if (error) setError(error.message);
    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortNewestFirst]);

  async function toggleExpand(order) {
    if (expandedId === order.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(order.id);
    if (!itemsByOrder[order.id]) {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      if (error) setError(error.message);
      setItemsByOrder((prev) => ({ ...prev, [order.id]: data || [] }));
    }
  }

  async function handleStatusChange(order, newStatus) {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);
    if (error) setError(error.message);
    else loadOrders();
  }

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const totalRevenueCents = filteredOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <>
      <AdminNav active="/admin/orders" />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl text-brand-crust">Orders</h1>
          <p className="text-sm text-brand-crust/60">
            {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"} · $
            {(totalRevenueCents / 100).toFixed(2)} total
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-brand-crust/20 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortNewestFirst((v) => !v)}
            className="text-sm text-brand-crust/70 border border-brand-crust/20 rounded-lg px-3 py-1.5 bg-white"
          >
            Sort: {sortNewestFirst ? "Newest first" : "Oldest first"}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {loading && <p>Loading…</p>}
        {!loading && filteredOrders.length === 0 && (
          <p className="text-sm text-brand-crust/50">No orders match this filter.</p>
        )}

        <ul className="space-y-2">
          {filteredOrders.map((order) => (
            <li key={order.id} className="bg-white rounded-lg shadow-sm">
              <button
                onClick={() => toggleExpand(order)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-crust truncate">
                    #{order.order_number} — {order.customer_name}
                  </p>
                  <p className="text-xs text-brand-crust/50">
                    {formatDate(order.created_at)} · {order.fulfillment_type} · weekend of{" "}
                    {order.weekend_date}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    order.status === "cancelled"
                      ? "bg-red-100 text-red-600"
                      : "bg-brand-crust/10 text-brand-crust"
                  }`}
                >
                  {order.status}
                </span>
                <span className="text-sm font-medium text-brand-crust whitespace-nowrap">
                  ${(order.total_cents / 100).toFixed(2)}
                </span>
              </button>

              {expandedId === order.id && (
                <div className="border-t border-brand-crust/10 p-4 space-y-3 text-sm">
                  <div className="grid sm:grid-cols-2 gap-2 text-brand-crust/70">
                    <p><span className="font-medium text-brand-crust">Phone:</span> {order.phone}</p>
                    <p><span className="font-medium text-brand-crust">Email:</span> {order.email}</p>
                    {order.fulfillment_type === "delivery" && (
                      <p className="sm:col-span-2">
                        <span className="font-medium text-brand-crust">Delivery address:</span>{" "}
                        {order.delivery_address}
                      </p>
                    )}
                    {order.notes && (
                      <p className="sm:col-span-2">
                        <span className="font-medium text-brand-crust">Notes:</span> {order.notes}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-brand-crust mb-1">Items</p>
                    {!itemsByOrder[order.id] ? (
                      <p className="text-brand-crust/40">Loading items…</p>
                    ) : (
                      <ul className="space-y-1">
                        {itemsByOrder[order.id].map((item) => (
                          <li key={item.id} className="text-brand-crust/70">
                            {item.quantity}× {item.item_name_snapshot}
                            {item.variant_label_snapshot ? ` — ${item.variant_label_snapshot}` : ""}
                            {item.addon_label_snapshot ? ` (${item.addon_label_snapshot})` : ""}
                            {item.message_text && (
                              <span className="block text-xs text-brand-crust/50">
                                ✎ &ldquo;{item.message_text}&rdquo;
                                {item.message_style ? ` — ${item.message_style}` : ""}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <label className="text-xs text-brand-crust/60" htmlFor={`status-${order.id}`}>
                      Status:
                    </label>
                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className="border border-brand-crust/20 rounded-lg px-2 py-1 text-sm bg-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s[0].toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export default function OrdersPage() {
  return (
    <AdminGuard>
      <OrdersPageInner />
    </AdminGuard>
  );
}
