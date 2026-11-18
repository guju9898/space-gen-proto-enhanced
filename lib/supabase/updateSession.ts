import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

type CreateClient = typeof createServerClient

/**
 * Refresh the Supabase auth session on a Proxy / middleware response.
 *
 * Matches the official @supabase/ssr Next.js proxy pattern:
 * - mutate request.cookies so Server Components see the new tokens
 * - rebuild NextResponse.next({ request }) so that request is what RSC receives
 * - also set cookies on the response so the browser stores them
 *
 * Call getUser() so an expired access token is refreshed when a valid refresh
 * token is present (the diagnosis for /studio/projects/[id] and Studio pages).
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
  opts: {
    createClient?: CreateClient
    supabaseUrl?: string
    supabaseAnonKey?: string
    /** Preserve proxy request headers (e.g. experiment) when setAll rebuilds the response. */
    requestHeaders?: Headers
  } = {}
): Promise<NextResponse> {
  const url = opts.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = opts.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const createClient = opts.createClient ?? createServerClient
  let res = response
  const headerSource = opts.requestHeaders

  const supabase = createClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, cacheHeaders?: Record<string, string>) {
        // 1) Request cookies → current Server Component render sees refreshed tokens
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        // 2) Rebuild the response from the mutated request (official pattern)
        res = headerSource
          ? NextResponse.next({ request: { headers: headerSource } })
          : NextResponse.next({ request })
        // 3) Response cookies → browser replaces expired tokens
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
        if (cacheHeaders) {
          for (const [header, value] of Object.entries(cacheHeaders)) {
            if (value) res.headers.set(header, value)
          }
        }
      },
    },
  })

  // Triggers refresh when the access token is expired and a refresh token is present.
  await supabase.auth.getUser()
  return res
}
