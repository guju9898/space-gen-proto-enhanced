"use client";
import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

/** Minimal v2 client; manual URL handling on callback; no duplicate GoTrue instances. */
export function getSupabaseBrowserClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      cookieOptions: {
        secure: process.env.NODE_ENV === "production", // NOT secure in dev
        sameSite: "lax",
        path: "/",
      },
    },
  });
  return _client;
}