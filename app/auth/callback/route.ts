import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Determines where the user should be redirected after successful authentication.
 *
 * Priority order:
 * 1. auth_redirect_next cookie (set before login)
 * 2. next query param (fallback)
 * 3. default Studio page
 */
async function getRedirectPath(request: Request): Promise<string> {
  const requestUrl = new URL(request.url)

  // Priority 1: cookie
  const cookieStore = await cookies()
  const cookieRedirect = cookieStore.get("auth_redirect_next")?.value

  if (cookieRedirect && cookieRedirect.startsWith("/")) {
    return cookieRedirect
  }

  // Priority 2: query param
  const queryRedirect = requestUrl.searchParams.get("next")

  if (queryRedirect && queryRedirect.startsWith("/")) {
    return queryRedirect
  }

  // Default
  return "/studio/interior"
}

export async function GET(request: Request) {
  try {
    /**
     * Create Supabase server client using Next.js cookie store.
     *
     * This ensures:
     * - Session cookies are written correctly
     * - Browser immediately receives authenticated state
     * - No race conditions after redirect
     */
    const supabase = await createSupabaseServerClient(cookies())

    /**
     * Exchange auth code for session.
     *
     * This step:
     * - Validates magic link / OAuth login
     * - Writes session cookies
     */
    const { error } = await supabase.auth.exchangeCodeForSession(request.url)

    if (error) {
      console.error("❌ Auth callback error:", error)

      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("error", "auth_callback_failed")

      return NextResponse.redirect(loginUrl)
    }

    /**
     * Determine redirect destination after successful login.
     */
    const redirectPath = await getRedirectPath(request)

    const redirectUrl = new URL(redirectPath, request.url)

    /**
     * Create redirect response.
     */
    const response = NextResponse.redirect(redirectUrl)

    /**
     * Clear redirect cookie to prevent stale redirects later.
     */
    response.cookies.set("auth_redirect_next", "", {
      path: "/",
      expires: new Date(0),
    })

    return response
  } catch (err) {
    console.error("❌ Unexpected auth callback failure:", err)

    const fallbackUrl = new URL("/auth/login", request.url)
    fallbackUrl.searchParams.set("error", "unexpected_auth_failure")

    return NextResponse.redirect(fallbackUrl)
  }
}
