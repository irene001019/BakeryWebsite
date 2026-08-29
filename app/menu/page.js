"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CartProvider } from "@/lib/cartContext";
import MenuItemCard from "@/components/MenuItemCard";
import CartPanel from "@/components/CartPanel";
import BotanicalDivider from "@/components/BotanicalDivider";

function MenuPageInner() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [
        { data: catData, error: catError },
        { data: itemData, error: itemError },
      ] = await Promise.all([
        supabase.from("menu_categories").select("*").order("sort_order"),
        supabase
          .from("menu_items")
          .select("*, menu_item_variants(*), menu_item_addons(*)")
          .eq("is_hidden", false)
          .order("sort_order"),
      ]);
      if (catError || itemError) setError((catError || itemError).message);
      setCategories(catData || []);
      setItems(itemData || []);
      setLoading(false);
    }
    load();
  }, []);

  const grouped = categories
    .map((cat) => ({ category: cat, items: items.filter((i) => i.category_id === cat.id) }))
    .filter((g) => g.items.length > 0);
  const uncategorized = items.filter((i) => !i.category_id);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 md:py-16">
      <header className="text-center mb-12">
        <BotanicalDivider className="w-40 h-8 mx-auto text-brand-latte mb-4" />
        <p className="font-script text-5xl text-brand-ink leading-none">JiaPan</p>
        <p className="font-display text-sm tracking-[0.35em] uppercase text-brand-ink/70 mt-2">
          Bakery
        </p>
        <p className="text-xs tracking-[0.2em] uppercase text-brand-ink/40 mt-3">
          Japanese Cheesecake · Basque Cheesecake · Buns
        </p>
        <BotanicalDivider className="w-40 h-8 mx-auto text-brand-latte mt-4 rotate-180" />
      </header>

      {error && <p className="text-red-600 text-sm text-center mb-6">{error}</p>}
      {loading && <p className="text-center text-brand-ink/50">Loading this weekend&apos;s menu…</p>}

      {!loading && items.length === 0 && !error && (
        <p className="text-center text-brand-ink/50">
          The menu isn&apos;t set up yet — add items from the admin panel to see them here.
        </p>
      )}

      <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-10">
          {grouped.map(({ category, items: catItems }) => (
            <section key={category.id}>
              <h2 className="font-display text-2xl text-brand-ink mb-4">{category.name}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {catItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
          {uncategorized.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-brand-ink mb-4">More</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {uncategorized.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
        <CartPanel />
      </div>
    </main>
  );
}

export default function MenuPage() {
  return (
    <CartProvider>
      <MenuPageInner />
    </CartProvider>
  );
}
