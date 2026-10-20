import { NextResponse } from "next/server"
import { AFFILIATE_COOKIE, AFFILIATE_VISITOR_COOKIE, DEFAULT_ATTRIBUTION_WINDOW_DAYS } from "@/lib/affiliates/config"
import { captureReferralClick, getAffiliateService } from "@/lib/affiliates/service"
import { isObject, isString } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

function cookieBase(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown
  if (!isObject(body) || !isString(body.code)) {
    return NextResponse.json({ captured: false })
  }
  const supabase = getAffiliateService()
  if (!supabase) return NextResponse.json({ captured: false })
  const cookieHeader = request.headers.get("cookie") ?? ""
  const existingCookie = readCookie(cookieHeader, AFFILIATE_COOKIE)
  const existingVisitorId = readCookie(cookieHeader, AFFILIATE_VISITOR_COOKIE)
  const result = await captureReferralClick({
    supabase,
    code: body.code,
    path: isString(body.path) ? body.path : null,
    now: new Date(),
    existingCookie,
    existingVisitorId,
  })
  const response = NextResponse.json({ captured: result.captured })
  if (result.visitorId) {
    response.cookies.set(AFFILIATE_VISITOR_COOKIE, result.visitorId, cookieBase(60 * 60 * 24 * 365))
  }
  if (result.captured && result.cookieValue) {
    response.cookies.set(
      AFFILIATE_COOKIE,
      result.cookieValue,
      cookieBase(60 * 60 * 24 * DEFAULT_ATTRIBUTION_WINDOW_DAYS)
    )
  }
  return response
}

function readCookie(header: string, name: string): string | null {
  const parts = header.split(/;\s*/)
  for (const part of parts) {
    const index = part.indexOf("=")
    if (index === -1) continue
    if (part.slice(0, index) === name) return decodeURIComponent(part.slice(index + 1))
  }
  return null
}
