import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { EmailOtpType } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/studio/exterior"

  console.log("Auth confirm params:", token_hash, type)

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_token`)
  }

  const supabase = createRouteHandlerClient({ cookies })

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  })

  if (error) {
    console.error("OTP verification failed:", error)
    return NextResponse.redirect(`${origin}/auth/login?error=auth_confirm_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}

