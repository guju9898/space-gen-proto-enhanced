import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { upsertLoopsContact, sendLoopsEvent } from "@/lib/loops"

export const runtime = "nodejs"

/** Env and clients are read inside the handler so the build never fails when secrets are unset (e.g. Vercel build). */
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceRoleKey) return null
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: "Webhook not configured (missing STRIPE_SECRET_KEY)" },
        { status: 503 }
      )
    }
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: "Webhook not configured (missing Supabase env)" },
        { status: 503 }
      )
    }

    // Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 503 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    // Handle event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "subscription" && session.metadata) {
          const userId = session.metadata.userId
          const planId = session.metadata.planId

          if (!userId || !planId) {
            console.error("❌ Missing userId or planId in checkout.session.completed metadata")
            break
          }

          // Update profiles table
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              current_plan: planId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: "active",
              past_due_since: null,
            })
            .eq("id", userId)

          if (updateError) {
            console.error("❌ Error updating profile after checkout:", updateError)
          } else {
            console.log(`✅ Profile updated for user ${userId} with plan ${planId}`)
            const customerEmail = session.customer_email ?? session.customer_details?.email ?? null
            if (customerEmail) {
              try {
                await upsertLoopsContact({
                  email: customerEmail,
                  userId,
                  plan: planId,
                })
                await sendLoopsEvent({
                  email: customerEmail,
                  eventName: "plan_started",
                  properties: { plan: planId },
                })
              } catch (err) {
                console.error("Loops plan_started failed", err)
              }
            }
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.customer && typeof invoice.customer === "string") {
          // Find user by stripe_customer_id
          const { data: profile, error: findError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", invoice.customer)
            .single()

          if (findError || !profile) {
            console.error("❌ User not found for customer:", invoice.customer)
            break
          }

          const now = new Date().toISOString()

          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "past_due",
              past_due_since: now,
            })
            .eq("id", profile.id)

          if (updateError) {
            console.error("❌ Error updating profile for payment failure:", updateError)
          } else {
            console.log(`✅ Profile updated for user ${profile.id} - payment failed`)
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.customer && typeof invoice.customer === "string") {
          // Find user by stripe_customer_id
          const { data: profile, error: findError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", invoice.customer)
            .single()

          if (findError || !profile) {
            console.error("❌ User not found for customer:", invoice.customer)
            break
          }

          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              past_due_since: null,
            })
            .eq("id", profile.id)

          if (updateError) {
            console.error("❌ Error updating profile for payment success:", updateError)
          } else {
            console.log(`✅ Profile updated for user ${profile.id} - payment succeeded`)
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        if (subscription.customer && typeof subscription.customer === "string") {
          // Find user by stripe_customer_id
          const { data: profile, error: findError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", subscription.customer)
            .single()

          if (findError || !profile) {
            console.error("❌ User not found for customer:", subscription.customer)
            break
          }

          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "canceled",
              current_plan: null,
            })
            .eq("id", profile.id)

          if (updateError) {
            console.error("❌ Error updating profile for subscription deletion:", updateError)
          } else {
            console.log(`✅ Profile updated for user ${profile.id} - subscription canceled`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Stripe webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

