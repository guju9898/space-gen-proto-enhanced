import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { upsertLoopsContact, sendLoopsEvent } from "@/lib/loops"
import { getStripePriceIds } from "@/lib/stripe/plans"

export const runtime = "nodejs"

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

/** Map Stripe price ID to plan code */
function priceIdToPlanCode(priceId: string): "intro" | "professional" | "business" | null {
  const ids = getStripePriceIds()
  if (priceId === ids.intro) return "intro"
  if (priceId === ids.professional) return "professional"
  if (priceId === ids.business) return "business"
  return null
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

        if (session.mode !== "subscription" || !session.metadata) break

        const userId = session.metadata.userId as string | undefined
        const planId = (session.metadata.planId as string) || (session.metadata.selected_plan as string)

        if (!userId || !planId) {
          console.error("❌ Missing userId or planId in checkout.session.completed metadata")
          break
        }

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        if (!subscriptionId) {
          console.error("❌ No subscription ID in checkout session")
          break
        }

        // Fetch subscription for period dates
        let sub: Stripe.Subscription
        try {
          sub = await stripe.subscriptions.retrieve(subscriptionId)
        } catch (e) {
          console.error("❌ Failed to retrieve subscription:", e)
          break
        }

        const stripeSub = sub as Stripe.Subscription & {
          current_period_start?: number
          current_period_end?: number
        }

        const periodStart = stripeSub.current_period_start
          ? new Date(stripeSub.current_period_start * 1000).toISOString()
          : new Date().toISOString()
        const periodEnd = stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        // Upsert subscriptions table
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_code: planId,
            status: "active",
            intro_offer_used: planId === "intro",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
            rollover_to_plan: planId === "intro" ? "professional" : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )

        // Update profiles (existing behavior)
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            current_plan: planId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            past_due_since: null,
          })
          .eq("id", userId)

        if (updateError) {
          console.error("❌ Error updating profile after checkout:", updateError)
        } else {
          console.log(`✅ Profile updated for user ${userId} with plan ${planId}`)
        }

        if (planId === "intro") {
          // One-time intro: record claim, set usage, then attach schedule to roll into Pro
          await supabase.from("intro_offer_claims").upsert(
            { user_id: userId, claimed_at: new Date().toISOString() },
            { onConflict: "user_id" }
          )

          const now = new Date()
          const introPeriodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          await supabase.from("user_usage").upsert(
            {
              user_id: userId,
              period_start: periodStart,
              period_end: introPeriodEnd,
              plan_code: "intro",
              credits_allocated: 40,
              credits_used: 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,period_start" }
          )

          const priceIds = getStripePriceIds()
          const introPriceId = priceIds.intro
          const proPriceId = priceIds.professional
          if (introPriceId && proPriceId) {
            try {
              const schedule = await stripe.subscriptionSchedules.create({
                from_subscription: subscriptionId,
              })
              await stripe.subscriptionSchedules.update(schedule.id, {
                end_behavior: "release",
                phases: [
                  {
                    items: [{ price: introPriceId, quantity: 1 }],
                    duration: { interval: "week", interval_count: 1 },
                  },
                  { items: [{ price: proPriceId, quantity: 1 }] },
                ],
              })
              await supabase
                .from("subscriptions")
                .update({ stripe_schedule_id: schedule.id, updated_at: new Date().toISOString() })
                .eq("user_id", userId)
            } catch (scheduleErr) {
              console.error("❌ Failed to create intro→pro schedule:", scheduleErr)
            }
          }
        }

        const customerEmail = session.customer_email ?? session.customer_details?.email ?? null
        if (customerEmail) {
          try {
            await upsertLoopsContact({ email: customerEmail, userId, plan: planId })
            await sendLoopsEvent({ email: customerEmail, eventName: "plan_started", properties: { plan: planId } })
          } catch (err) {
            console.error("Loops plan_started failed", err)
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

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id
        if (!customerId) break

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!profile) break

        const priceId = subscription.items?.data?.[0]?.price?.id
        const planCode = priceId ? priceIdToPlanCode(priceId) : null
        const periodStart = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
              ? "past_due"
              : subscription.status === "canceled"
                ? "canceled"
                : "inactive"

        await supabase
          .from("subscriptions")
          .update({
            plan_code: planCode || undefined,
            status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.id)

        if (planCode) {
          await supabase
            .from("profiles")
            .update({
              current_plan: planCode,
              subscription_status: status === "canceled" ? "canceled" : status,
            })
            .eq("id", profile.id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id
        if (!customerId) break

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!profile) break

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.id)

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

