import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { upsertLoopsContact, sendLoopsEvent } from "@/lib/loops"
import { trySafeLocalReturnPath } from "@/lib/auth/safe-return-path"

/**
 * Redirect destination after successful auth.
 * Priority: auth_redirect_next cookie → next query param → /studio/exterior
 */
async function getRedirectPath(request: Request): Promise<string> {
  const requestUrl = new URL(request.url)
  const cookieStore = await cookies()
  const cookieRaw = cookieStore.get("auth_redirect_next")?.value
  const fromCookie = trySafeLocalReturnPath(cookieRaw)
  if (fromCookie) return fromCookie
  const queryNext = requestUrl.searchParams.get("next")
  const fromQuery = trySafeLocalReturnPath(queryNext)
  if (fromQuery) return fromQuery
  return "/studio/exterior"
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const token_hash = url.searchParams.get("token_hash")
    const type = url.searchParams.get("type") as "email" | "magiclink" | null

    const supabase = await createSupabaseServerClient()

    let error: { message?: string } | null = null
    let flowUsed: "token_hash" | "code" | null = null
    let authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null

    if (token_hash) {
      flowUsed = "token_hash"
      const result = await supabase.auth.verifyOtp({
        token_hash,
        type: type === "magiclink" ? "magiclink" : "email",
      })
      error = result.error
      authUser = result.data?.user ?? null
    } else if (code) {
      flowUsed = "code"
      const result = await supabase.auth.exchangeCodeForSession(request.url)
      error = result.error
      authUser = result.data?.session?.user ?? null
    } else {
      error = { message: "Missing code or token_hash in callback URL" }
    }

    if (error) {
      console.error("❌ Auth callback error:", error?.message ?? error, error)
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("error", "auth_callback_failed")
      if (error?.message) {
        loginUrl.searchParams.set("message", String(error.message).slice(0, 200))
      }
      return NextResponse.redirect(loginUrl)
    }

    if (authUser?.email) {
      try {
        await upsertLoopsContact({
          email: authUser.email,
          firstName: (authUser.user_metadata?.first_name as string) ?? "",
          userId: authUser.id,
          plan: "free",
          signedUpAt: new Date().toISOString(),
        })
        await sendLoopsEvent({
          email: authUser.email,
          eventName: "account_created",
          properties: { plan: "free" },
        })
      } catch (err) {
        console.error("Loops account_created failed", err)
      }
    }

    // TEMP DEBUG: flow and cookie names (no secrets)
    const cookieStoreAfterAuth = await cookies()
    const cookieNames = cookieStoreAfterAuth.getAll().map((c) => c.name)
    console.log("AUTH CALLBACK COOKIES", cookieNames)
    console.log("AUTH CALLBACK FLOW", flowUsed)

    const redirectPath = await getRedirectPath(request)
    const redirectUrl = new URL(redirectPath, request.url)
    const response = NextResponse.redirect(redirectUrl)

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
