import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function getRedirectPath(request: Request): string {
  const requestUrl = new URL(request.url)
  const fromQuery = requestUrl.searchParams.get("next")
  if (fromQuery) return fromQuery

  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const match = cookieHeader.match(/\bauth_redirect_next=([^;]+)/)
    if (match) {
      try {
        return decodeURIComponent(match[1].trim())
      } catch {
        // ignore malformed
      }
    }
  }
  return "/studio/interior"
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const nextPath = getRedirectPath(request)

  if (code) {
    try {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("❌ Auth callback error:", error)
        return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
      }
    } catch (error) {
      console.error("❌ Auth callback exception:", error)
      return NextResponse.redirect(new URL("/?error=auth_config", request.url))
    }
  }

  const redirectUrl = new URL(nextPath, request.url)
  const response = NextResponse.redirect(redirectUrl)
  // Clear the redirect cookie so it isn't reused
  response.headers.append(
    "Set-Cookie",
    "auth_redirect_next=; path=/; max-age=0; SameSite=Lax"
  )
  return response
}

