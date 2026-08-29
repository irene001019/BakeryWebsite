"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/lib/supabaseClient";

function CategoriesPageInner() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .order("sort_order");
    if (error) setError(error.message);
    else setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const nextSort = categories.length
      ? Math.max(...categories.map((c) => c.sort_order)) + 1
      : 0;
    const { error } = await supabase
      .from("menu_categories")
      .insert({ name: newName.trim(), sort_order: nextSort });
    if (error) setError(error.message);
    else {
      setNewName("");
      loadCategories();
    }
  }

  async function handleRename(id, name) {
    if (!name.trim()) return;
    const { error } = await supabase.from("menu_categories").update({ name }).eq("id", id);
    if (error) setError(error.message);
  }

  async function handleDelete(id) {
    if (
      !confirm(
        "Delete this category? Items in it will keep their data but lose their category."
      )
    )
      return;
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) setError(error.message);
    else loadCategories();
  }

  async function move(id, direction) {
    const idx = categories.findIndex((c) => c.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const a = categories[idx];
    const b = categories[swapIdx];
    await supabase.from("menu_categories").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("menu_categories").update({ sort_order: a.sort_order }).eq("id", b.id);
    loadCategories();
  }

  return (
    <>
      <AdminNav active="/admin/categories" />
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="font-display text-2xl text-brand-crust">Menu categories</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                <div className="flex flex-col text-xs">
                  <button onClick={() => move(c.id, "up")} disabled={i === 0} className="disabled:opacity-30">▲</button>
                  <button onClick={() => move(c.id, "down")} disabled={i === categories.length - 1} className="disabled:opacity-30">▼</button>
                </div>
                <input
                  defaultValue={c.name}
                  onBlur={(e) => e.target.value !== c.name && handleRename(c.id, e.target.value)}
                  className="flex-1 border border-transparent hover:border-brand-crust/20 focus:border-brand-accent rounded px-2 py-1"
                />
                <button onClick={() => handleDelete(c.id)} className="text-red-500 text-sm">Delete</button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1 border border-brand-crust/20 rounded-lg px-3 py-2"
          />
          <button type="submit" className="bg-brand-accent text-white rounded-lg px-4 py-2">
            Add
          </button>
        </form>
      </main>
    </>
  );
}

export default function CategoriesPage() {
  return (
    <AdminGuard>
      <CategoriesPageInner />
    </AdminGuard>
  );
}
