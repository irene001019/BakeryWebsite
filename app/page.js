import { supabase } from "@/lib/supabaseClient";

// This is a temporary placeholder, not the real homepage (that's Phase 9).
// Its only job right now is to prove the Next.js <-> Supabase connection
// works end to end before we build anything real on top of it.
export default async function Home() {
  const { data: settings, error } = await supabase
    .from("settings")
    .select("*")
    .single();

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-3xl text-brand-crust">
          JiaPan Bakery — Foundation Check
        </h1>
        <p>
          This placeholder page confirms the project is wired up correctly.
          Replace it in Phase 9 with the real homepage.
        </p>
        {error && (
          <p className="text-red-600 text-sm">
            Could not reach Supabase yet: {error.message}. Double-check your
            .env.local values and that schema.sql has been run.
          </p>
        )}
        {settings && (
          <p className="text-sm text-brand-crust/70">
            ✅ Connected to Supabase. Order cutoff is currently set to{" "}
            {settings.order_cutoff_day} at {settings.order_cutoff_time}.
          </p>
        )}
      </div>
    </main>
  );
}
