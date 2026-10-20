import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { upsertLoopsContact, sendLoopsEvent } from "@/lib/loops"
import { trySafeLocalReturnPath } from "@/lib/auth/safe-return-path"
import { AFFILIATE_COOKIE } from "@/lib/affiliates/config"
import { bindReferral, getAffiliateService } from "@/lib/affiliates/service"

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

/** Safe, short user-facing OAuth error text — no URLs, HTML, or control chars. */
function sanitizeOAuthErrorMessage(
  errorDescription: string | null,
  errorCode: string | null,
  error: string | null
): string {
  const raw = (errorDescription || errorCode || error || "OAuth sign-in failed").trim()
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[<>`'"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  const safe = cleaned.slice(0, 160)
  return safe || "OAuth sign-in failed"
}

function redirectAuthFailure(
  request: Request,
  errorCode: string,
  message?: string
): NextResponse {
  const loginUrl = new URL("/auth/login", request.url)
  loginUrl.searchParams.set("error", errorCode)
  if (message) {
    loginUrl.searchParams.set("message", message.slice(0, 200))
  }
  return NextResponse.redirect(loginUrl)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const code = searchParams.get("code")
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type") as "email" | "magiclink" | null
    const oauthError = searchParams.get("error")
    const oauthErrorCode = searchParams.get("error_code")
    const oauthErrorDescription = searchParams.get("error_description")
    const flowId = searchParams.get("sb_flow_id")

    console.log("[auth/callback]", {
      host: url.hostname,
      hasCode: Boolean(code),
      hasTokenHash: Boolean(token_hash),
      hasOAuthError: Boolean(oauthError),
      hasFlowId: Boolean(flowId),
      error_code: oauthErrorCode || undefined,
      paramNames: Array.from(searchParams.keys()),
    })

    // A. OAuth provider error — handle before missing-code path
    if (oauthError) {
      const message = sanitizeOAuthErrorMessage(
        oauthErrorDescription,
        oauthErrorCode,
        oauthError
      )
      console.error("[auth/callback] OAuth provider error", {
        host: url.hostname,
        error: oauthError.slice(0, 80),
        error_code: oauthErrorCode?.slice(0, 80) || undefined,
      })
      return redirectAuthFailure(request, "auth_callback_failed", message)
    }

    const supabase = await createSupabaseServerClient()

    let error: { message?: string } | null = null
    let flowUsed: "token_hash" | "code" | null = null
    let authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null =
      null

    // B. Magic link / email OTP
    if (token_hash) {
      flowUsed = "token_hash"
      const result = await supabase.auth.verifyOtp({
        token_hash,
        type: type === "magiclink" ? "magiclink" : "email",
      })
      error = result.error
      authUser = result.data?.user ?? null
    } else if (code) {
      // C. OAuth PKCE code exchange (code string only — not request.url)
      flowUsed = "code"
      // Installed @supabase/supabase-js accepts a single authCode argument.
      const result = await supabase.auth.exchangeCodeForSession(code)
      error = result.error
      authUser = result.data?.session?.user ?? null
    } else {
      // D. Neither OAuth code nor magic-link token
      error = { message: "Missing authentication callback parameters" }
    }

    if (error) {
      console.error("[auth/callback] Auth failed", {
        host: url.hostname,
        flowUsed,
        message: error?.message ? String(error.message).slice(0, 200) : undefined,
      })
      return redirectAuthFailure(
        request,
        "auth_callback_failed",
        error?.message ? String(error.message).slice(0, 200) : undefined
      )
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

    if (authUser?.id) {
      try {
        const affiliateService = getAffiliateService()
        if (affiliateService) {
          const cookieStore = await cookies()
          await bindReferral({
            supabase: affiliateService,
            userId: authUser.id,
            cookieValue: cookieStore.get(AFFILIATE_COOKIE)?.value ?? null,
          })
        }
      } catch (err) {
        console.error("[affiliates] attribution bind failed", err instanceof Error ? err.message.slice(0, 120) : "unknown")
      }
    }

    console.log("[auth/callback] success", {
      host: url.hostname,
      flowUsed,
    })

    const redirectPath = await getRedirectPath(request)
    const redirectUrl = new URL(redirectPath, request.url)
    const response = NextResponse.redirect(redirectUrl)

    response.cookies.set("auth_redirect_next", "", {
      path: "/",
      expires: new Date(0),
    })

    return response
  } catch (err) {
    console.error("[auth/callback] Unexpected failure", {
      message: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    })
    const fallbackUrl = new URL("/auth/login", request.url)
    fallbackUrl.searchParams.set("error", "unexpected_auth_failure")
    return NextResponse.redirect(fallbackUrl)
  }
}
