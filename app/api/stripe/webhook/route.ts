import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { upsertLoopsContact, sendLoopsEvent } from "@/lib/loops"
import { syncAffiliateStripeEvent } from "@/lib/affiliates/stripe-events"
import { getStripePriceIds, introRollsIntoProfessional, planCodeForPriceId, shouldRefreshIntroCredits } from "@/lib/stripe/plans"
import { readSubscriptionPeriod } from "@/lib/stripe/subscriptionPeriod"
import { CATALOG } from "@/lib/pricing/catalog"
import { logCreditError } from "@/lib/usage/creditErrors"
import { grantIntroUsage, type IntroGrantDb } from "@/lib/usage/introGrant"

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

/** Map Stripe price ID to plan code, including annual prices when those env vars exist. */
function priceIdToPlanCode(priceId: string): "intro" | "professional" | "business" | null {
  return planCodeForPriceId(priceId)
}

function noteWriteError(scope: string, userId: string, error: { message?: string } | null) {
  if (!error) return
  console.error(`❌ ${scope} failed for user ${userId}: ${error.message ?? "unknown error"}`)
}

function linePriceId(line: unknown): string | null {
  if (!line || typeof line !== "object") return null
  const row = line as {
    price?: { id?: string } | string
    pricing?: { price_details?: { price?: string } }
  }
  if (typeof row.price === "string") return row.price
  if (row.price && typeof row.price.id === "string") return row.price.id
  const modern = row.pricing?.price_details?.price
  return typeof modern === "string" ? modern : null
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

    let introGrantFailed = false

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

        const period = readSubscriptionPeriod(sub)
        const periodStart = period?.startIso ?? new Date().toISOString()
        const periodEnd = period?.endIso ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        // Prefer the live Stripe subscription status so trials stay usable.
        const profileStatus =
          sub.status === "trialing"
            ? "trialing"
            : sub.status === "active"
              ? "active"
              : sub.status === "past_due"
                ? "past_due"
                : "active"

        // Upsert subscriptions table
        const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_code: planId,
            status: profileStatus === "trialing" ? "trialing" : "active",
            intro_offer_used: planId === "intro",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
            rollover_to_plan: planId === "intro" && introRollsIntoProfessional() ? "professional" : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        noteWriteError("subscriptions upsert", userId, subscriptionError)

        // Update profiles (existing behavior)
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            current_plan: planId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: profileStatus,
            past_due_since: null,
          })
          .eq("id", userId)
        noteWriteError("profile update", userId, updateError)
        if (!updateError) console.log(`✅ Profile updated for user ${userId} with plan ${planId}`)

        if (planId === "intro") {
          const { error: claimError } = await supabase.from("intro_offer_claims").upsert(
            { user_id: userId, claimed_at: new Date().toISOString() },
            { onConflict: "user_id" }
          )
          noteWriteError("intro offer claim", userId, claimError)

          const grant = await grantIntroUsage(supabase as unknown as IntroGrantDb, { userId, periodStart, periodEnd })
          if (!grant.ok) {
            console.error("[credits] webhook_grant", userId, "intro", null, CATALOG.intro.credits, grant.error)
            await logCreditError({
              user_id: userId,
              plan_id: "intro",
              amount: CATALOG.intro.credits,
              stage: "webhook_grant",
              message: grant.error,
            })
            introGrantFailed = true
          }

          const priceIds = getStripePriceIds()
          const introPriceId = priceIds.intro
          const proPriceId = priceIds.professional
          if (introRollsIntoProfessional() && introPriceId && proPriceId) {
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
              const { error: scheduleWriteError } = await supabase
                .from("subscriptions")
                .update({ stripe_schedule_id: schedule.id, updated_at: new Date().toISOString() })
                .eq("user_id", userId)
              if (scheduleWriteError) {
                console.error(
                  `❌ Intro rollover schedule id was not saved for user ${userId}: ${scheduleWriteError.message}`
                )
              }
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

          noteWriteError("profile update after payment", profile.id, updateError)
          if (!updateError) console.log(`✅ Profile updated for user ${profile.id} - payment succeeded`)

          const introPriceId = getStripePriceIds().intro
          const line = invoice.lines?.data?.[0]
          const cyclePriceId = linePriceId(line)
          if (
            shouldRefreshIntroCredits({
              billingReason: invoice.billing_reason,
              priceId: cyclePriceId,
              introPriceId,
            })
          ) {
            const period = (line as { period?: { start?: number; end?: number } } | undefined)?.period
            const cycleStart = period?.start ? new Date(period.start * 1000).toISOString() : null
            const cycleEnd = period?.end ? new Date(period.end * 1000).toISOString() : null
            if (cycleStart && cycleEnd) {
              const grant = await grantIntroUsage(supabase as unknown as IntroGrantDb, {
                userId: profile.id,
                periodStart: cycleStart,
                periodEnd: cycleEnd,
              })
              if (!grant.ok) {
                console.error("[credits] webhook_grant", profile.id, "intro", null, CATALOG.intro.credits, grant.error)
                await logCreditError({
                  user_id: profile.id,
                  plan_id: "intro",
                  amount: CATALOG.intro.credits,
                  stage: "webhook_grant",
                  message: grant.error,
                })
                introGrantFailed = true
              }
            }
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id
        if (!customerId) break

        const stripeSub = subscription as Stripe.Subscription & {
          current_period_start?: number
          current_period_end?: number
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!profile) break

        const priceId = subscription.items?.data?.[0]?.price?.id
        const planCode = priceId ? priceIdToPlanCode(priceId) : null
        const periodStart = stripeSub.current_period_start
          ? new Date(stripeSub.current_period_start * 1000).toISOString()
          : null
        const periodEnd = stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000).toISOString()
          : null
        // Preserve Stripe `trialing` so intro/trial customers keep generation access.
        // Mapping trialing → inactive was blocking the 40-credit weekly intro allowance.
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "trialing"
              ? "trialing"
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
              // Keep canceled as canceled; otherwise persist active | trialing | past_due | inactive
              subscription_status: status === "canceled" ? "canceled" : status,
            })
            .eq("id", profile.id)
        } else if (status === "trialing" || status === "active" || status === "past_due") {
          // Price ID may not map (env mismatch) but Stripe status is still authoritative —
          // never leave a trialing customer stuck as inactive.
          await supabase
            .from("profiles")
            .update({
              subscription_status: status,
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

    if (introGrantFailed) {
      return NextResponse.json({ error: "Failed to grant intro credits" }, { status: 500 })
    }

    const affiliateSync = await syncAffiliateStripeEvent(event, supabase)
    if (affiliateSync.retry) {
      return NextResponse.json({ error: "Affiliate ledger update failed" }, { status: 500 })
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

