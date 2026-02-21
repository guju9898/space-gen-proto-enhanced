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

  // Debug: log redirect cookie (remove once login is stable)
  if (process.env.NODE_ENV === "development") {
    console.log("[auth/callback] auth_redirect_next cookie:", cookieRedirect ? decodeURIComponent(cookieRedirect) : "(not set)")
  }

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
    const requestUrl = new URL(request.url)
    const tokenHash = requestUrl.searchParams.get("token_hash")
    const type = requestUrl.searchParams.get("type") ?? "email"
    const code = requestUrl.searchParams.get("code")

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
     * Supabase sends magic links in two forms:
     * - PKCE (code): ?code=... → exchangeCodeForSession(request.url)
     * - Token hash: ?token_hash=...&type=email → verifyOtp({ token_hash, type })
     * We support both so login works regardless of project/email template config.
     */
    let error: { message?: string } | null = null

    if (tokenHash) {
      const result = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      })
      error = result.error
    } else if (code) {
      const result = await supabase.auth.exchangeCodeForSession(request.url)
      error = result.error
    } else {
      error = { message: "Missing token_hash or code in callback URL" }
    }

    if (error) {
      console.error("❌ Auth callback error:", error?.message ?? error, error)

      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("error", "auth_callback_failed")
      // In dev, pass through the Supabase message so you can see it in the URL / UI
      if (process.env.NODE_ENV === "development" && error?.message) {
        loginUrl.searchParams.set("message", String(error.message).slice(0, 200))
      }

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
