import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key.
 * WARNING: This client bypasses RLS. Use ONLY in server-side API routes
 * for the AI module's SQL execution.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
