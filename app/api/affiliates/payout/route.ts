import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAffiliateService, requestPayout } from "@/lib/affiliates/service"

export const runtime = "nodejs"

export async function POST() {
  const supabaseUser = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })
  const service = getAffiliateService()
  if (!service) return NextResponse.json({ error: "Payouts are not available yet." }, { status: 503 })
  const result = await requestPayout({ supabase: service, userId: user.id })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
