import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { enforceCredits } from "@/lib/usage/enforceCredits"
import { lifecycleOffersEnabled } from "@/lib/offers/config"
import { selectLifecycleOffer } from "@/lib/offers/eligibility"
import { parseLifecycleState } from "@/lib/offers/state"
import { PRICING_CAMPAIGNS } from "@/lib/pricing/promotions"
import type { PlanCode } from "@/lib/pricing/catalog"

export const runtime = "nodejs"

const COOKIE = "rs_lifecycle"

function planOf(value: string | null | undefined): "none" | PlanCode {
  if (value === "intro" || value === "professional" || value === "business") return value
  return "none"
}

function couponsReady(): string[] {
  return PRICING_CAMPAIGNS.filter((campaign) => {
    const id = campaign.stripeCouponEnv ? process.env[campaign.stripeCouponEnv] : undefined
    return typeof id === "string" && id.startsWith("coupon_")
  }).map((campaign) => campaign.id)
}

/** Server-decided lifecycle offer. The response never includes a coupon id. */
export async function GET() {
  if (!lifecycleOffersEnabled()) {
    return NextResponse.json({ offer: null, authenticated: false })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ offer: null, authenticated: false })

    const [{ data: profile }, creditCheck, events, jar] = await Promise.all([
      supabase.from("profiles").select("current_plan, subscription_status").eq("id", user.id).maybeSingle(),
      enforceCredits(user.id),
      supabase.from("user_render_events").select("id", { count: "exact", head: true }),
      cookies(),
    ])

    const allowance = creditCheck.monthlyLimit
    const remaining = creditCheck.creditsRemaining
    const used =
      allowance !== null && remaining !== null ? Math.max(0, Math.round(allowance - remaining)) : 0
    const successfulRenders = typeof events.count === "number" ? events.count : used

    const offer = selectLifecycleOffer({
      enabled: true,
      workflowBusy: false,
      plan: planOf(profile?.current_plan),
      subscriptionStatus: profile?.subscription_status ?? null,
      successfulRenders,
      creditsRemaining: remaining,
      creditAllowance: allowance,
      now: new Date(),
      hasAffiliate: false,
      redeemedCount: 0,
      couponsReady: couponsReady(),
      state: parseLifecycleState(jar.get(COOKIE)?.value),
    })

    return NextResponse.json({ offer, authenticated: true })
  } catch (error) {
    console.error("Lifecycle offer lookup failed", error)
    return NextResponse.json({ offer: null, authenticated: false })
  }
}
