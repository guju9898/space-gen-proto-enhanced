import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { applyServerCookieWrites, type CookieToSet } from "@/lib/supabase/serverCookies"

/**
 * SERVER-SIDE SUPABASE CLIENT (FOR API ROUTES, SERVER ACTIONS & SERVER COMPONENTS)
 *
 * Persists auth cookies for Next.js 16 App Router using getAll/setAll only.
 * Cookie writes are best-effort in Server Components (see applyServerCookieWrites);
 * proxy.ts refreshes expired sessions for /studio/*.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          applyServerCookieWrites(cookieStore, cookiesToSet)
        },
      },
    }
  )
}
