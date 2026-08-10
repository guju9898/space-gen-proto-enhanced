/**
 * POST /api/human-polish/checkout
 *
 * Initiate a Human Polish one-time-payment Stripe Checkout Session
 * (mode: "payment"). Completely separate from subscription checkout.
 *
 * AI Render Packs: authenticate with draftToken (existing behavior).
 * Build-Ready: authenticate with paymentToken (Phase 7B); price from
 * approved_package + approved_amount only.
 */

import { NextResponse } from "next/server"
import {
  humanPolishAbsoluteUrl,
  resolveHumanPolishAppUrl,
} from "@/lib/human-polish/app-url"
import { buildReadyApprovedLineLabel } from "@/lib/human-polish/build-ready-guards"
import { authenticateDraftRequest } from "@/lib/human-polish/draft-auth"
import { authenticateBuildReadyPaymentRequest } from "@/lib/human-polish/payment-auth"
import { checkRateLimit, getClientIp, HP_RATE_LIMITS } from "@/lib/human-polish/rate-limit"
import {
  buildHumanPolishMetadata,
  computeHumanPolishAmount,
  getHumanPolishStripe,
  toStripeLineItems,
  type HumanPolishLineItem,
} from "@/lib/human-polish/stripe"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  isBuildReadyPackage,
  isHumanPolishServiceFamily,
  isPackageForFamily,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isObject } from "@/lib/types/typeGuards"
import Stripe from "stripe"

export const runtime = "nodejs"

const BUILD_READY_CHECKOUT_STATUSES = new Set(["ready_for_payment", "awaiting_payment"])

type CheckoutBody = {
  requestId?: unknown
  draftToken?: unknown
  paymentToken?: unknown
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(
    "checkout",
    ip,
    HP_RATE_LIMITS.checkout.limit,
    HP_RATE_LIMITS.checkout.windowMs
  )
  if (rl.configurationError) {
    return NextResponse.json(
      { error: "Human Polish rate limiting is not configured." },
      { status: 503 }
    )
  }
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    )
  }

  const stripe = getHumanPolishStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Checkout is not configured (missing STRIPE_SECRET_KEY)." },
      { status: 503 }
    )
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Human Polish is not configured." }, { status: 503 })
  }

  let body: CheckoutBody
  try {
    const parsed: unknown = await request.json()
    if (!isObject(parsed)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }
    body = parsed as CheckoutBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  // Peek family via requestId when paymentToken present (Build-Ready path).
  const wantsPaymentToken =
    typeof body.paymentToken === "string" && body.paymentToken.trim().length > 0

  if (wantsPaymentToken) {
    return handleBuildReadyCheckout(request, stripe, supabase, body)
  }

  return handleAiRenderPackCheckout(request, stripe, supabase, body)
}

async function handleBuildReadyCheckout(
  request: Request,
  stripe: Stripe,
  supabase: NonNullable<ReturnType<typeof getHumanPolishSupabaseService>>,
  body: CheckoutBody
) {
  const auth = await authenticateBuildReadyPaymentRequest(
    supabase,
    body.requestId,
    body.paymentToken
  )
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, ...(auth.code ? { code: auth.code } : {}) },
      { status: auth.status }
    )
  }
  const req = auth.request

  if (!BUILD_READY_CHECKOUT_STATUSES.has(req.status)) {
    return NextResponse.json(
      { error: "This package requires scope review and approval before payment." },
      { status: 409 }
    )
  }
  if (!isBuildReadyPackage(req.approved_package)) {
    return NextResponse.json({ error: "Approved package is missing." }, { status: 409 })
  }
  if (
    typeof req.approved_amount !== "number" ||
    !Number.isSafeInteger(req.approved_amount) ||
    req.approved_amount <= 0
  ) {
    return NextResponse.json({ error: "Approved amount is missing." }, { status: 409 })
  }
  if (!req.payment_request_id) {
    return NextResponse.json({ error: "Payment request is missing." }, { status: 409 })
  }

  const approvedPackage = req.approved_package
  const approvedAmountCents = req.approved_amount
  const paymentRequestId = req.payment_request_id
  const requestId = req.id

  // Reuse open Checkout Session for the same payment_request_id when possible.
  if (req.status === "awaiting_payment" && req.stripe_checkout_session_id) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(req.stripe_checkout_session_id)
      const metaOk =
        existing.metadata?.paymentRequestId === paymentRequestId &&
        existing.metadata?.requestId === requestId
      if (existing.status === "open" && existing.url && metaOk) {
        return NextResponse.json({
          url: existing.url,
          sessionId: existing.id,
          amount: {
            currency: req.currency || "usd",
            standardAmountCents: approvedAmountCents,
            totalBeforeTaxCents: approvedAmountCents,
            discountAmountCents: 0,
            rushAmountCents: 0,
            promotionType: "none",
            subscriberDiscountApplied: false,
            rushApplied: false,
            lineItems: [
              {
                label: buildReadyApprovedLineLabel(approvedPackage),
                amountCents: approvedAmountCents,
                kind: "package",
              },
            ],
          },
        })
      }
    } catch {
      // Fall through and create a replacement session for the same payment_request_id.
    }
  }

  const lineItems: HumanPolishLineItem[] = [
    {
      kind: "package",
      label: buildReadyApprovedLineLabel(approvedPackage),
      amountCents: approvedAmountCents,
    },
  ]

  let origin: string
  try {
    origin = resolveHumanPolishAppUrl({ request })
  } catch {
    return NextResponse.json(
      { error: "Application URL is not configured." },
      { status: 500 }
    )
  }
  const successUrl = humanPolishAbsoluteUrl(
    origin,
    "/human-polish/success?session_id={CHECKOUT_SESSION_ID}"
  )
  const cancelUrl = humanPolishAbsoluteUrl(
    origin,
    buildBuildReadyCancelPath(requestId, typeof body.paymentToken === "string" ? body.paymentToken : "")
  )

  const metadata = buildHumanPolishMetadata({
    requestId,
    family: "build-ready",
    pkg: approvedPackage,
    phoneNormalized: null,
    promotionType: "none",
    subscriberDiscountApplied: false,
    rushApproved: false,
    leadSource: null,
    paymentRequestId,
    approvedPackage,
  })

  const customerEmail =
    typeof req.contact_email === "string" && req.contact_email ? req.contact_email : undefined

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: toStripeLineItems(lineItems),
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      customer_email: customerEmail,
      client_reference_id: requestId,
      metadata,
      payment_intent_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[human-polish] Stripe checkout error:", {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
      })
      return NextResponse.json(
        { error: error.message || "Stripe API error." },
        { status: error.statusCode || 500 }
      )
    }
    console.error("[human-polish] checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 })
  }

  // Preserve approved_amount / approved_package / payment_request_id — do not overwrite.
  const { error: updateError } = await supabase
    .from("human_polish_requests")
    .update({
      status: "awaiting_payment",
      payment_status: "pending",
      stripe_checkout_session_id: session.id,
    })
    .eq("id", requestId)
  if (updateError) {
    console.error("[human-polish] failed to persist Build-Ready checkout state")
  }

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 })
  }

  return NextResponse.json({
    url: session.url,
    sessionId: session.id,
    amount: {
      currency: req.currency || "usd",
      standardAmountCents: approvedAmountCents,
      totalBeforeTaxCents: approvedAmountCents,
      discountAmountCents: 0,
      rushAmountCents: 0,
      promotionType: "none",
      subscriberDiscountApplied: false,
      rushApplied: false,
      lineItems: lineItems.map((li) => ({
        label: li.label,
        amountCents: li.amountCents,
        kind: li.kind,
      })),
    },
  })
}

function buildBuildReadyCancelPath(requestId: string, rawToken: string): string {
  const params = new URLSearchParams({ token: rawToken })
  return `/human-polish/pay/${encodeURIComponent(requestId)}?${params.toString()}`
}

async function handleAiRenderPackCheckout(
  request: Request,
  stripe: Stripe,
  supabase: NonNullable<ReturnType<typeof getHumanPolishSupabaseService>>,
  body: CheckoutBody
) {
  const auth = await authenticateDraftRequest(supabase, body.requestId, body.draftToken)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, ...(auth.code ? { code: auth.code } : {}) },
      { status: auth.status }
    )
  }
  const req = auth.request

  if (!isHumanPolishServiceFamily(req.family)) {
    return NextResponse.json({ error: "Request has an invalid service family." }, { status: 409 })
  }
  const family: HumanPolishServiceFamily = req.family
  if (family === "build-ready") {
    return NextResponse.json(
      {
        error:
          "Build-Ready checkout requires a secure payment link from your approval email.",
      },
      { status: 409 }
    )
  }
  if (!isPackageForFamily(family, req.requested_package)) {
    return NextResponse.json({ error: "Request has an invalid package." }, { status: 409 })
  }
  const pkg: HumanPolishPackage = req.requested_package as HumanPolishPackage

  const requestId = req.id
  const phoneNormalized = typeof req.phone_normalized === "string" ? req.phone_normalized : null
  const leadSource = typeof req.lead_source === "string" ? req.lead_source : null
  const rushApproved = req.rush_approved === true

  let firstPurchaseEligible = false
  if (family === "ai-render-pack" && pkg === "25" && phoneNormalized) {
    const { data: priorPaid, error: priorErr } = await supabase
      .from("human_polish_requests")
      .select("id")
      .eq("family", "ai-render-pack")
      .eq("phone_normalized", phoneNormalized)
      .eq("payment_status", "paid")
      .neq("id", requestId)
      .limit(1)
    if (priorErr) {
      console.error("[human-polish] first-purchase eligibility lookup failed")
      return NextResponse.json({ error: "Failed to verify checkout eligibility." }, { status: 500 })
    }
    firstPurchaseEligible = !priorPaid || priorPaid.length === 0
  }

  let subscriberEligible = false
  let authedUserId: string | null = null
  try {
    const authedSupabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await authedSupabase.auth.getUser()
    if (user) {
      authedUserId = user.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_plan, subscription_status")
        .eq("id", user.id)
        .maybeSingle()
      if (
        profile &&
        (profile.current_plan === "professional" || profile.current_plan === "business") &&
        profile.subscription_status === "active"
      ) {
        subscriberEligible = true
      }
    }
  } catch (err) {
    console.error(
      "[human-polish] subscriber lookup skipped:",
      err instanceof Error ? err.message : "unknown"
    )
  }

  const amount = computeHumanPolishAmount({
    family,
    pkg,
    firstPurchaseEligible,
    subscriberEligible,
    rushApproved,
    approvedAmountCents: null,
  })
  if (!amount.ok) {
    return NextResponse.json({ error: amount.error }, { status: 409 })
  }

  let origin: string
  try {
    origin = resolveHumanPolishAppUrl({ request })
  } catch {
    return NextResponse.json(
      { error: "Application URL is not configured." },
      { status: 500 }
    )
  }
  const successUrl = humanPolishAbsoluteUrl(
    origin,
    "/human-polish/success?session_id={CHECKOUT_SESSION_ID}"
  )
  const cancelUrl = humanPolishAbsoluteUrl(origin, "/human-polish")

  const metadata = buildHumanPolishMetadata({
    requestId,
    family,
    pkg,
    phoneNormalized,
    promotionType: amount.promotionType,
    subscriberDiscountApplied: amount.subscriberDiscountApplied,
    rushApproved,
    leadSource,
  })

  const customerEmail =
    typeof req.contact_email === "string" && req.contact_email ? req.contact_email : undefined

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: toStripeLineItems(amount.lineItems),
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      customer_email: customerEmail,
      client_reference_id: requestId,
      metadata,
      payment_intent_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[human-polish] Stripe checkout error:", {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
      })
      return NextResponse.json(
        { error: error.message || "Stripe API error." },
        { status: error.statusCode || 500 }
      )
    }
    console.error("[human-polish] checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 })
  }

  const update: Record<string, unknown> = {
    status: "awaiting_payment",
    payment_status: "pending",
    stripe_checkout_session_id: session.id,
    promotion_type: amount.promotionType,
    subscriber_discount_applied: amount.subscriberDiscountApplied,
    discount_amount: amount.discountAmountCents,
    quoted_amount: amount.totalBeforeTaxCents,
  }
  if (typeof req.standard_amount !== "number") {
    update.standard_amount = amount.standardAmountCents
  }
  if (authedUserId && !req.user_id) {
    update.user_id = authedUserId
  }
  const { error: updateError } = await supabase
    .from("human_polish_requests")
    .update(update)
    .eq("id", requestId)
  if (updateError) {
    console.error("[human-polish] failed to persist checkout state")
  }

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 })
  }

  return NextResponse.json({
    url: session.url,
    sessionId: session.id,
    amount: {
      currency: req.currency && typeof req.currency === "string" ? req.currency : "usd",
      standardAmountCents: amount.standardAmountCents,
      totalBeforeTaxCents: amount.totalBeforeTaxCents,
      discountAmountCents: amount.discountAmountCents,
      rushAmountCents: amount.rushAmountCents,
      promotionType: amount.promotionType,
      subscriberDiscountApplied: amount.subscriberDiscountApplied,
      rushApplied: amount.rushAmountCents > 0,
      lineItems: amount.lineItems.map((li) => ({
        label: li.label,
        amountCents: li.amountCents,
        kind: li.kind,
      })),
    },
  })
}
