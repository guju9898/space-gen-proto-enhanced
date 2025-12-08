"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side singleton that mirrors the old API used in components like AuthCookieSync.
 * Internally delegates to @supabase/auth-helpers-nextjs to avoid cookie format mismatches.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client;
  _client = createClientComponentClient();
  return _client;
}




