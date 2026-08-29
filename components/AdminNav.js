"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminNav({ active }) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const links = [
    { href: "/admin/menu", label: "Menu" },
    { href: "/admin/categories", label: "Categories" },
  ];

  return (
    <nav className="flex items-center justify-between border-b border-brand-crust/10 px-6 py-4 bg-white">
      <div className="flex gap-4 font-medium">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              active === l.href
                ? "text-brand-accent"
                : "text-brand-crust/70 hover:text-brand-crust"
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-brand-crust/60 hover:text-brand-crust"
      >
        Log out
      </button>
    </nav>
  );
}
