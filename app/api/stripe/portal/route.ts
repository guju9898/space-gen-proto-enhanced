import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Stripe from "stripe"

export const runtime = "nodejs"

// Validate Stripe secret key exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required")
}

const stripe = new Stripe(stripeSecretKey)

export async function POST(request: Request) {
  try {
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

    // Get user's Stripe customer ID from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      )
    }

    // Get origin for return URL
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/subscription`,
    })

    if (!session.url) {
      throw new Error("Failed to create Stripe Customer Portal session URL")
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("❌ Stripe portal session creation error:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}

