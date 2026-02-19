import { createServerClient } from "@supabase/ssr"
import type { CookieMethodsServerDeprecated, CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * SERVER-SIDE SUPABASE CLIENT (FOR API ROUTES & AUTH CALLBACK)
 *
 * This client reads and writes authentication cookies via the provided
 * Next.js cookie store. Use in route handlers and the auth callback so
 * session cookies are handled correctly for magic link and OAuth.
 *
 * IMPORTANT: Caller must pass the result of `cookies()` (Promise of the cookie store).
 * Uses the anon key, NOT the service role key.
 */
export async function createSupabaseServerClient(
  cookieStore: ReturnType<typeof cookies>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
    )
  }

  const store = await cookieStore

  const cookieMethods: CookieMethodsServerDeprecated = {
    get(name: string) {
      return store.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      store.set({
        name,
        value,
        ...options,
      })
    },
    remove(name: string, options: CookieOptions) {
      store.set({
        name,
        value: "",
        ...options,
      })
    },
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  })
}
