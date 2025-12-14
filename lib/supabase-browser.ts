"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side singleton that creates a Supabase client with proper API key configuration.
 * Uses @supabase/ssr for better compatibility and explicit API key handling.
 * 
 * CRITICAL: For PKCE flows, the verifier cookie MUST be readable by JavaScript.
 * createBrowserClient automatically reads cookies from document.cookie, but we need
 * to ensure the cookie handlers are properly configured.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }

  // createBrowserClient with explicit cookie handlers to ensure PKCE verifier is readable
  // The default implementation should work, but we're being explicit to ensure cookies are accessible
  _client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Force read all cookies - this ensures PKCE verifier is available
        if (typeof document === "undefined") return [];
        return document.cookie.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookiesToSet) {
        // Set cookies with proper attributes for PKCE flow
        if (typeof document === "undefined") return;
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieString = `${name}=${value}`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
          if (options?.secure) cookieString += `; secure`;
          // IMPORTANT: Don't set httpOnly for PKCE verifier - it must be readable by JS
          document.cookie = cookieString;
        });
      },
    },
  });

  return _client;
}




