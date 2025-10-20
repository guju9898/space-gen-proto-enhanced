"use client";

import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

/**
 * Minimal, stable browser client with supabase-js v2.76.0
 * Avoids deprecated helpers & multiple clients.
 */
export function getSupabaseBrowserClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // We will manually handle tokens on the callback page
      detectSessionInUrl: false,
    },
  });

  return _client;
}
