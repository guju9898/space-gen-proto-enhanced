import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase configuration for webhook")
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    // Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
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

