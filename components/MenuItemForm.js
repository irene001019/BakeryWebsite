"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const emptyVariant = () => ({ id: undefined, label: "", price: "" });
const emptyAddon = () => ({ id: undefined, label: "", priceDelta: "" });

// Used for both /admin/menu/new (itemId undefined) and
// /admin/menu/[id] (itemId set) — one form, two modes, so the fields
// never drift out of sync between "add" and "edit".
export default function MenuItemForm({ itemId }) {
  const router = useRouter();
  const isEdit = Boolean(itemId);

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [messageEligible, setMessageEligible] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [variants, setVariants] = useState([emptyVariant()]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("menu_categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, menu_item_variants(*), menu_item_addons(*)")
        .eq("id", itemId)
        .single();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setName(data.name);
      setDescription(data.description || "");
      setCategoryId(data.category_id || "");
      setMessageEligible(data.message_eligible);
      setPhotoUrl(data.photo_url || "");
      setVariants(
        data.menu_item_variants.length
          ? data.menu_item_variants
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((v) => ({
                id: v.id,
                label: v.label,
                price: (v.price_cents / 100).toString(),
              }))
          : [emptyVariant()]
      );
      setAddons(
        data.menu_item_addons
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((a) => ({
            id: a.id,
            label: a.label,
            priceDelta: (a.price_delta_cents / 100).toString(),
          }))
      );
      setLoading(false);
    }
    load();
  }, [itemId, isEdit]);

  function updateVariant(idx, field, value) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  }
  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }
  function removeVariant(idx) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateAddon(idx, field, value) {
    setAddons((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  }
  function addAddon() {
    setAddons((prev) => [...prev, emptyAddon()]);
  }
  function removeAddon(idx) {
    setAddons((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("menu-photos")
          .upload(path, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("menu-photos")
          .getPublicUrl(path);
        finalPhotoUrl = publicUrlData.publicUrl;
      }

      const payload = {
        name,
        description,
        category_id: categoryId || null,
        message_eligible: messageEligible,
        photo_url: finalPhotoUrl || null,
      };

      let savedItemId = itemId;
      if (isEdit) {
        const { error } = await supabase
          .from("menu_items")
          .update(payload)
          .eq("id", itemId);
        if (error) throw error;
      } else {
        const { data: maxSortRow } = await supabase
          .from("menu_items")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1)
          .single();
        const { data, error } = await supabase
          .from("menu_items")
          .insert({ ...payload, sort_order: (maxSortRow?.sort_order ?? -1) + 1 })
          .select()
          .single();
        if (error) throw error;
        savedItemId = data.id;
      }

      // Placeholder UUID used so the "not in (...)" filter below is
      // always valid SQL, even when there are zero IDs to keep
      // (meaning: delete everything that isn't in this impossible ID).
      const NONE = "00000000-0000-0000-0000-000000000000";

      // Sync variants: remove any that were deleted in the form, then
      // upsert the rest. Only needed in edit mode — a brand new item
      // has no existing rows to clean up.
      if (isEdit) {
        const keepIds = variants.filter((v) => v.id).map((v) => v.id);
        await supabase
          .from("menu_item_variants")
          .delete()
          .eq("menu_item_id", savedItemId)
          .not("id", "in", `(${keepIds.length ? keepIds.join(",") : NONE})`);
      }
      for (const [i, v] of variants.entries()) {
        if (!v.label.trim() || v.price === "") continue;
        const row = {
          menu_item_id: savedItemId,
          label: v.label.trim(),
          price_cents: Math.round(parseFloat(v.price) * 100),
          sort_order: i,
        };
        if (v.id) {
          await supabase.from("menu_item_variants").update(row).eq("id", v.id);
        } else {
          await supabase.from("menu_item_variants").insert(row);
        }
      }

      if (isEdit) {
        const keepIds = addons.filter((a) => a.id).map((a) => a.id);
        await supabase
          .from("menu_item_addons")
          .delete()
          .eq("menu_item_id", savedItemId)
          .not("id", "in", `(${keepIds.length ? keepIds.join(",") : NONE})`);
      }
      for (const [i, a] of addons.entries()) {
        if (!a.label.trim()) continue;
        const row = {
          menu_item_id: savedItemId,
          label: a.label.trim(),
          price_delta_cents: Math.round((parseFloat(a.priceDelta) || 0) * 100),
          sort_order: i,
        };
        if (a.id) {
          await supabase.from("menu_item_addons").update(row).eq("id", a.id);
        } else {
          await supabase.from("menu_item_addons").insert(row);
        }
      }

      router.push("/admin/menu");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="font-display text-2xl text-brand-crust">
        {isEdit ? "Edit item" : "Add item"}
      </h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="block text-sm mb-1" htmlFor="name">Name</label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-brand-crust/20 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-brand-crust/20 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="category">Category</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-brand-crust/20 rounded-lg px-3 py-2"
        >
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Photo</label>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="w-32 h-32 object-cover rounded-lg mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={messageEligible}
          onChange={(e) => setMessageEligible(e.target.checked)}
        />
        Customers can add a handwritten cake message to this item
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium mb-1">Sizes / prices</legend>
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              placeholder="e.g. 6-inch"
              value={v.label}
              onChange={(e) => updateVariant(i, "label", e.target.value)}
              className="flex-1 border border-brand-crust/20 rounded-lg px-3 py-2"
            />
            <span className="text-sm">$</span>
            <input
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0"
              value={v.price}
              onChange={(e) => updateVariant(i, "price", e.target.value)}
              className="w-24 border border-brand-crust/20 rounded-lg px-3 py-2"
            />
            <button type="button" onClick={() => removeVariant(i)} className="text-red-500 text-sm">✕</button>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="text-sm text-brand-accent">
          + Add size
        </button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium mb-1">Add-ons (e.g. flavors) — optional</legend>
        {addons.map((a, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              placeholder="e.g. Strawberry"
              value={a.label}
              onChange={(e) => updateAddon(i, "label", e.target.value)}
              className="flex-1 border border-brand-crust/20 rounded-lg px-3 py-2"
            />
            <span className="text-sm">+$</span>
            <input
              placeholder="0.00"
              type="number"
              step="0.01"
              value={a.priceDelta}
              onChange={(e) => updateAddon(i, "priceDelta", e.target.value)}
              className="w-24 border border-brand-crust/20 rounded-lg px-3 py-2"
            />
            <button type="button" onClick={() => removeAddon(i)} className="text-red-500 text-sm">✕</button>
          </div>
        ))}
        <button type="button" onClick={addAddon} className="text-sm text-brand-accent">
          + Add add-on
        </button>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-accent text-white rounded-lg px-5 py-2 font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/menu")}
          className="text-brand-crust/60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
