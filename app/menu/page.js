"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { CartProvider } from "@/lib/cartContext";
import MenuItemCard from "@/components/MenuItemCard";
import CartPanel from "@/components/CartPanel";
import StatusBanner from "@/components/StatusBanner";
import FulfillmentSection from "@/components/FulfillmentSection";
import OrderReviewSection from "@/components/OrderReviewSection";

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
      <header className="text-center mb-8">
        <Image
          src="/logo.jpg"
          alt="JiaPan Bakery — Japanese Cheesecake, Basque Cheesecake, Buns"
          width={1316}
          height={924}
          className="w-72 sm:w-96 mx-auto h-auto"
          priority
        />
      </header>

      <StatusBanner />

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

      <FulfillmentSection />
      <OrderReviewSection />
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
