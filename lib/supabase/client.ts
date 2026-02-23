import { createBrowserClient } from "@supabase/ssr"

/**
 * CLIENT-SIDE SUPABASE CLIENT
 *
 * This client must use cookie-backed storage so it reads the same
 * session set by the server callback (exchangeCodeForSession / verifyOtp).
 *
 * Without this adapter, Supabase defaults to localStorage, causing
 * AuthContext to miss valid cookie sessions.
 */

function parseCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined") return []

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const [name, ...rest] = cookie.split("=")
      return {
        name,
        value: rest.join("="),
      }
    })
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookies()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieString = `${name}=${value}`

          if (options?.path) cookieString += `; path=${options.path}`
          else cookieString += `; path=/`

          if (options?.maxAge)
            cookieString += `; max-age=${options.maxAge}`

          if (options?.expires)
            cookieString += `; expires=${options.expires.toUTCString()}`

          if (options?.sameSite)
            cookieString += `; samesite=${options.sameSite}`

          if (options?.secure)
            cookieString += `; secure`

          document.cookie = cookieString
        })
      },
    },
  })
}
