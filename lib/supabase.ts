import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client for the waitlist source-of-truth writes.
 *
 * Uses the SERVICE ROLE key — it bypasses RLS, so this module must
 * never reach the browser. The `server-only` import makes a client
 * bundle that pulls this file a build error.
 *
 * `waitlist_signups` has RLS enabled with no policies: the anon key
 * can't touch it at all, only this service-role client can. That's the
 * deliberate design (the email list must never be anon-readable).
 *
 * No session/cookie handling — this is a stateless admin client doing
 * one insert per request, so persistSession / autoRefreshToken /
 * detectSessionInUrl are all off (Supabase's recommended server-side
 * service-role config).
 *
 * Required env (server-only, NOT NEXT_PUBLIC_):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

// Lazily build the client so a missing env var doesn't crash module
// load — the route handles the unconfigured case explicitly.
export function getSupabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
