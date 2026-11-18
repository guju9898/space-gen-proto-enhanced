import type { CookieOptions } from "@supabase/ssr"

export type CookieToSet = { name: string; value: string; options: CookieOptions }

type CookieWriter = {
  set: (name: string, value: string, options?: CookieOptions) => void
}

/**
 * Write auth cookies from @supabase/ssr.
 *
 * Server Components cannot mutate cookies — Next throws
 * "Cookies can only be modified in a Server Action or Route Handler".
 * Ignore that error; proxy.ts refreshes the session on /studio/* instead.
 * Server Actions and Route Handlers can set cookies, so those writes succeed.
 */
export function applyServerCookieWrites(cookieStore: CookieWriter, cookiesToSet: CookieToSet[]): void {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options)
    })
  } catch {
    // Server Components can't set cookies; proxy refreshes the session.
  }
}
