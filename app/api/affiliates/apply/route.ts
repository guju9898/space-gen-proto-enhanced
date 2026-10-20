import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { applyForAffiliate, getAffiliateService } from "@/lib/affiliates/service"
import { isObject, isString } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabaseUser = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to apply." }, { status: 401 })
  const service = getAffiliateService()
  if (!service) return NextResponse.json({ error: "Affiliate applications are not available yet." }, { status: 503 })
  const body = (await request.json().catch(() => null)) as unknown
  if (!isObject(body) || !isString(body.displayName) || !isString(body.partnerType)) {
    return NextResponse.json({ error: "Enter your name and partner type." }, { status: 400 })
  }
  const result = await applyForAffiliate({
    supabase: service,
    userId: user.id,
    displayName: body.displayName,
    partnerType: body.partnerType,
    website: isString(body.website) ? body.website : null,
    note: isString(body.note) ? body.note : null,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
