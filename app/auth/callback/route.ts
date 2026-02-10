import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"

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

  // Redirect to home or the specified next URL
  // Cookies are automatically set by Supabase SSR during exchangeCodeForSession
  return NextResponse.redirect(new URL(next, request.url))
}

