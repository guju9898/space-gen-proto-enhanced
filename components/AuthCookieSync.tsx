"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Ensures browser session is initialized/kept fresh.
 * No manual cookie parsing; relies on the helper library.
 */
export default function AuthCookieSync() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    // Touch session so auth-helpers will (re)hydrate if needed
    supabase.auth.getSession().catch(() => {});
  }, []);
  return null;
}
