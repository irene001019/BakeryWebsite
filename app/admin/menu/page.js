"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/lib/supabaseClient";

function MenuPageInner() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    const [{ data: itemsData, error: itemsError }, { data: catData }] =
      await Promise.all([
        supabase
          .from("menu_items")
          .select("*, menu_item_variants(*), menu_item_addons(*)")
          .order("sort_order"),
        supabase.from("menu_categories").select("*").order("sort_order"),
      ]);
    if (itemsError) setError(itemsError.message);
    setItems(itemsData || []);
    setCategories(catData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleHidden(item) {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_hidden: !item.is_hidden })
      .eq("id", item.id);
    if (error) setError(error.message);
    else loadData();
  }

  async function handleDelete(item) {
    if (
      !confirm(
        `Delete "${item.name}"? This can't be undone. Consider hiding it instead if it's ever been ordered.`
      )
    )
      return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) setError(error.message);
    else loadData();
  }

  async function move(item, direction, siblings) {
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const a = siblings[idx];
    const b = siblings[swapIdx];
    await supabase.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id);
    loadData();
  }

  const uncategorized = items.filter((i) => !i.category_id);
  const grouped = categories.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category_id === cat.id),
  }));

  return (
    <>
      <AdminNav active="/admin/menu" />
      <main className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-brand-crust">Menu items</h1>
          <Link
            href="/admin/menu/new"
            className="bg-brand-accent text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            + Add item
          </Link>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {loading && <p>Loading…</p>}
        {!loading && categories.length === 0 && (
          <p className="text-sm text-brand-crust/60">
            No categories yet —{" "}
            <Link href="/admin/categories" className="underline">
              add one
            </Link>{" "}
            before adding menu items.
          </p>
        )}
        {grouped.map(({ category, items: catItems }) => (
          <section key={category.id}>
            <h2 className="font-semibold text-brand-crust/80 mb-2">{category.name}</h2>
            <ItemList
              items={catItems}
              onToggleHidden={toggleHidden}
              onDelete={handleDelete}
              onMove={(item, dir) => move(item, dir, catItems)}
            />
          </section>
        ))}
        {uncategorized.length > 0 && (
          <section>
            <h2 className="font-semibold text-brand-crust/80 mb-2">Uncategorized</h2>
            <ItemList
              items={uncategorized}
              onToggleHidden={toggleHidden}
              onDelete={handleDelete}
              onMove={(item, dir) => move(item, dir, uncategorized)}
            />
          </section>
        )}
      </main>
    </>
  );
}

function ItemList({ items, onToggleHidden, onDelete, onMove }) {
  if (items.length === 0) return <p className="text-sm text-brand-crust/50">No items yet.</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={item.id} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
          <div className="flex flex-col text-xs">
            <button onClick={() => onMove(item, "up")} disabled={i === 0} className="disabled:opacity-30">▲</button>
            <button onClick={() => onMove(item, "down")} disabled={i === items.length - 1} className="disabled:opacity-30">▼</button>
          </div>
          <div className="flex-1">
            <p className={`font-medium ${item.is_hidden ? "text-brand-crust/40 line-through" : "text-brand-crust"}`}>
              {item.name}
            </p>
            <p className="text-xs text-brand-crust/50">
              {item.menu_item_variants?.length || 0} size
              {item.menu_item_variants?.length === 1 ? "" : "s"}
              {item.message_eligible ? " · message-eligible" : ""}
            </p>
          </div>
          <Link href={`/admin/menu/${item.id}`} className="text-sm text-brand-accent">Edit</Link>
          <button onClick={() => onToggleHidden(item)} className="text-sm text-brand-crust/60">
            {item.is_hidden ? "Unhide" : "Hide"}
          </button>
          <button onClick={() => onDelete(item)} className="text-sm text-red-500">Delete</button>
        </li>
      ))}
    </ul>
  );
}

export default function MenuPage() {
  return (
    <AdminGuard>
      <MenuPageInner />
    </AdminGuard>
  );
}
