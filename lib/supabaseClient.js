import { createClient } from "@supabase/supabase-js";

// Public client — safe to use in client components.
// Relies on Row Level Security (see supabase/schema.sql) to restrict
// what the anon key can actually read/write.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
