import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

export function getServiceClient() {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "[supabase] SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in env"
    );
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  return client;
}
