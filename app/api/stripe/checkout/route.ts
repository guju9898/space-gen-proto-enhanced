import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { isObject, isString } from "@/lib/types/typeGuards"
import { CATALOG } from "@/lib/pricing/catalog"
import { evaluatePromotion, findCampaign } from "@/lib/pricing/promotions"
import { AFFILIATE_COOKIE, readCustomerCouponId } from "@/lib/affiliates/config"
import { decideReferralDiscount } from "@/lib/affiliates/discount"
import { resolveCheckoutAffiliate } from "@/lib/affiliates/service"
import { introRollsIntoProfessional, resolveCheckoutPrice, type PlanCode } from "@/lib/stripe/plans"

export const runtime = "nodejs"

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: "2025-10-29.clover" })
}

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  let planId: string | undefined

  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: "Checkout not configured (missing STRIPE_SECRET_KEY)" },
        { status: 503 }
      )
    }
    // Initialize Supabase server client (reads auth from cookies)
    const supabase = await createSupabaseServerClient()

    // Authenticate user from cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json() as unknown

    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const bodyData = body as {
      planId?: unknown
      interval?: unknown
      promotionId?: unknown
      affiliateCode?: unknown
      src?: unknown
      rep?: unknown
    }

    planId = isString(bodyData.planId) ? bodyData.planId : undefined
    const requestedInterval = isString(bodyData.interval) ? bodyData.interval : null
    const promotionId = isString(bodyData.promotionId) ? bodyData.promotionId : null
    const { src, rep } = bodyData

    // Validate planId (intro | professional | business)
    const validPlans: PlanCode[] = ["intro", "professional", "business"]
    if (!planId || !validPlans.includes(planId as PlanCode)) {
      return NextResponse.json(
        { error: "Invalid planId. Must be 'intro', 'professional', or 'business'" },
        { status: 400 }
      )
    }

    // Intro eligibility: only first-time; check intro_offer_claims
    if (planId === "intro") {
      const supabaseService = getSupabaseService()
      if (!supabaseService) {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 503 }
        )
      }
      const { data: existing } = await supabaseService
        .from("intro_offer_claims")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json(
          { error: "Intro offer already claimed. Choose Professional or Business." },
          { status: 403 }
        )
      }
    }

    const resolved = resolveCheckoutPrice(planId, requestedInterval)
    if (!resolved.ok) {
      if (resolved.error === "annual_unconfigured") {
        return NextResponse.json(
          { error: "Annual billing is not available for this plan." },
          { status: 409 }
        )
      }
      console.error("Stripe price ID missing for plan:", planId)
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan" },
        { status: 500 }
      )
    }
    const priceId = resolved.priceId
    const billingInterval = resolved.interval

    // Validate price ID format (must start with price_)
    if (!priceId.startsWith("price_")) {
      console.error("❌ Invalid price ID format (must start with 'price_'):", priceId.substring(0, 10) + "...")
      return NextResponse.json(
        { error: "Invalid Stripe price ID format" },
        { status: 500 }
      )
    }

    // Get origin for success/cancel URLs
    const originHeader = request.headers.get("origin")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const origin = originHeader || appUrl || "http://localhost:3000"

    // Validate origin is a valid URL
    try {
      new URL(origin)
    } catch {
      console.error("❌ Invalid origin URL:", origin)
      return NextResponse.json(
        { error: "Invalid origin URL configuration" },
        { status: 500 }
      )
    }

    const successUrl = `${origin}/studio?billing=success`
    const cancelUrl = `${origin}/onboarding?step=3&billing=cancel`

    const metadata: Record<string, string> = {
      userId: user.id,
      planId,
      billing_interval: billingInterval,
      ...(src ? { src: isObject(src) ? JSON.stringify(src) : String(src) } : {}),
      ...(rep ? { rep: isObject(rep) ? JSON.stringify(rep) : String(rep) } : {}),
    }
    if (planId === "intro") {
      metadata.intro_credits = String(CATALOG.intro.credits)
      if (introRollsIntoProfessional()) metadata.rollover_plan = "professional"
    }

    const campaign = findCampaign(promotionId)
    const couponId = campaign?.stripeCouponEnv ? process.env[campaign.stripeCouponEnv] : undefined
    const couponConfigured = typeof couponId === "string" && couponId.startsWith("coupon_")
    const affiliateService = getSupabaseService()
    const cookieStore = await cookies()
    const affiliate = affiliateService
      ? await resolveCheckoutAffiliate({
          supabase: affiliateService,
          userId: user.id,
          cookieValue: cookieStore.get(AFFILIATE_COOKIE)?.value ?? null,
        }).catch(() => ({
          hasAffiliate: false,
          code: null as string | null,
          programActive: false,
          customerDiscountPercent: 0,
        }))
      : { hasAffiliate: false, code: null as string | null, programActive: false, customerDiscountPercent: 0 }
    const promo = evaluatePromotion({
      campaignId: promotionId,
      plan: planId as PlanCode,
      interval: billingInterval,
      now: new Date(),
      redeemedCount: 0,
      surface: "subscription",
      hasAffiliate: affiliate.hasAffiliate,
      couponConfigured,
    })
    if (promo.eligible && promo.campaignId) {
      metadata.promotion_id = promo.campaignId
    }
    const referralCoupon = readCustomerCouponId()
    const referralDiscount = decideReferralDiscount({
      programActive: affiliate.programActive,
      hasAttribution: affiliate.hasAffiliate,
      selfReferral: false,
      surface: "subscription",
      customerDiscountPercent: affiliate.customerDiscountPercent,
      couponConfigured: Boolean(referralCoupon),
      promotion: promo,
    })
    if (affiliate.code) metadata.affiliate_code = affiliate.code

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(promo.eligible && couponConfigured
        ? { discounts: [{ coupon: couponId }] }
        : referralDiscount.apply && referralCoupon
          ? { discounts: [{ coupon: referralCoupon }] }
          : {}),
      ...(affiliate.code
        ? { subscription_data: { metadata: { userId: user.id, affiliate_code: affiliate.code } } }
        : {}),
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    console.log("✅ [STRIPE CHECKOUT] Session created:", session.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    // Enhanced error logging
    if (error instanceof Stripe.errors.StripeError) {
      console.error("❌ Stripe API error:", {
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      })
      
      // Return more specific error messages for common issues
      if (error.type === "StripeInvalidRequestError") {
        if (error.message.includes("No such price")) {
          const envVarName = planId === "professional" ? "PRO" : "BUSINESS"
          return NextResponse.json(
            { error: `Invalid price ID. Please verify NEXT_PUBLIC_STRIPE_PRICE_${envVarName} is set correctly.` },
            { status: 400 }
          )
        }
        if (error.message.includes("Invalid API Key")) {
          return NextResponse.json(
            { error: "Stripe API key configuration error" },
            { status: 500 }
          )
        }
      }
      
      return NextResponse.json(
        { error: error.message || "Stripe API error" },
        { status: error.statusCode || 500 }
      )
    }

    console.error("❌ Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

