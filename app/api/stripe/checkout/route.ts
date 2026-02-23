import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { isObject, isString } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: "2025-10-29.clover" })
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
      src?: unknown
      rep?: unknown
    }

    planId = isString(bodyData.planId) ? bodyData.planId : undefined
    const { src, rep } = bodyData

    // Validate planId
    if (!planId || !["professional", "business"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid planId. Must be 'professional' or 'business'" },
        { status: 400 }
      )
    }

    // Map planId to Stripe price ID
    const priceId =
      planId === "professional"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS

    if (!priceId || typeof priceId !== "string" || priceId.trim() === "") {
      console.error("❌ Stripe price ID missing or invalid for plan:", planId)
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan" },
        { status: 500 }
      )
    }

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

    // DEBUG LOG (temporary - remove after verification)
    const isLiveMode = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_")
    console.log("🔍 [STRIPE CHECKOUT DEBUG]")
    console.log("  planId:", planId)
    console.log("  priceId:", priceId)
    console.log("  Stripe mode:", isLiveMode ? "LIVE" : "TEST")
    console.log("  success_url:", successUrl)
    console.log("  cancel_url:", cancelUrl)
    console.log("  userId:", user.id)
    console.log("  userEmail:", user.email)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      metadata: {
        userId: user.id,
        planId,
        ...(src ? { src: isObject(src) ? JSON.stringify(src) : String(src) } : {}),
        ...(rep ? { rep: isObject(rep) ? JSON.stringify(rep) : String(rep) } : {}),
      },
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

