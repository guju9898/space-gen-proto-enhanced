import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * SERVER-SIDE SUPABASE CLIENT (FOR API ROUTES)
 * 
 * This client reads authentication from cookies set by Supabase SSR.
 * Use this in API routes to authenticate users from their browser session.
 * 
 * IMPORTANT: This uses the anon key, NOT the service role key.
 * It reads cookies that were set by the client-side login flow.
 */
export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
    )
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // Cookie setting may fail in some contexts (e.g., middleware)
          // This is expected and can be ignored
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.delete(name)
        } catch (error) {
          // Cookie removal may fail in some contexts
          // This is expected and can be ignored
        }
      },
    },
  })
}



