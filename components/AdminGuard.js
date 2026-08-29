"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Wraps any /admin page (except the login page itself) and bounces
// anyone without a valid session to /admin/login. This is a
// single-owner admin area — there's exactly one account, created
// manually in the Supabase dashboard (see supabase/phase1_admin_setup.sql).
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "authed"
  const router = useRouter();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/admin/login");
      } else {
        setStatus("authed");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace("/admin/login");
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (status === "checking") {
    return (
      <p className="p-8 text-center text-brand-crust/60">Checking sign-in…</p>
    );
  }

  return children;
}
