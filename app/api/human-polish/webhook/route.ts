/**
 * POST /api/human-polish/webhook
 *
 * Dedicated Stripe webhook for Human Polish one-time payments. This is a SEPARATE
 * endpoint from the subscription webhook (`/api/stripe/webhook`) and uses its own
 * signing secret (`STRIPE_HP_WEBHOOK_SECRET`).
 *
 * NOTE ON SPEC: docs/human-polish-v1-spec.md §5.2 suggests extending the existing
 * subscription webhook with a guarded branch. This implementation instead uses a
 * dedicated endpoint (as directed for this workstream). The safety guarantees are
 * preserved: every branch is guarded by `mode === "payment"` and
 * `metadata.productType === "human_polish"`, and NO subscription table, plan,
 * credit, or lifecycle record is ever touched here.
 *
 * Events handled:
 *   - checkout.session.completed   → mark the request paid (idempotent)
 *   - payment_intent.succeeded     → mark the request paid (idempotent)
 *   - payment_intent.payment_failed→ log only (payment stays pending)
 *
 * Configure this endpoint in the Stripe Dashboard (Developers → Webhooks) pointing
 * at `/api/human-polish/webhook` and copy its signing secret into
 * `STRIPE_HP_WEBHOOK_SECRET`. Do NOT reuse the subscription webhook secret.
 */

import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import {
  getHumanPolishStripe,
  getHumanPolishWebhookSecret,
  isHumanPolishMetadata,
} from "@/lib/human-polish/stripe"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"

export const runtime = "nodejs"

type PaidUpdate = {
  requestId: string
  sessionId?: string | null
  paymentIntentId?: string | null
  customerId?: string | null
}

/**
 * Idempotently mark a Human Polish request as paid. Re-delivery of the same event
 * (or overlap between checkout.session.completed and payment_intent.succeeded) is
 * a no-op once payment_status is already "paid".
 */
async function markRequestPaid(supabase: SupabaseClient, update: PaidUpdate): Promise<void> {
  const { requestId, sessionId, paymentIntentId, customerId } = update

  const { data: existing, error: readErr } = await supabase
    .from("human_polish_requests")
    .select("id, status, payment_status")
    .eq("id", requestId)
    .maybeSingle()

  if (readErr) {
    console.error("[human-polish] webhook: failed to load request")
    return
  }
  if (!existing) {
    console.error("[human-polish] webhook: request not found for id in metadata")
    return
  }
  if (existing.payment_status === "paid") {
    // Idempotent: already processed.
    return
  }

  const patch: Record<string, unknown> = {
    payment_status: "paid",
    status: "paid",
  }
  if (sessionId) patch.stripe_checkout_session_id = sessionId
  if (paymentIntentId) patch.stripe_payment_intent_id = paymentIntentId
  if (customerId) patch.stripe_customer_id = customerId

  const { error: updateErr } = await supabase
    .from("human_polish_requests")
    .update(patch)
    .eq("id", requestId)
    // Guard against a racing concurrent delivery flipping it first.
    .neq("payment_status", "paid")

  if (updateErr) {
    console.error("[human-polish] webhook: failed to mark request paid")
    return
  }

  // ---------------------------------------------------------------------------
  // EMAIL INTEGRATION SEAM (owned by the Email Agent — do NOT implement here).
  // When payment is confirmed, the "Payment received" milestone email (spec §6.2,
  // event #2) plus the internal alert to frank@renderspace.ai should be sent.
  // Wire that here once the Loops helper exists, e.g.:
  //   await sendHumanPolishMilestone("payment_received", { requestId })
  // Keep it non-blocking and best-effort so email failures never fail the webhook.
  // TODO(email): trigger Human Polish "payment received" notification.
  // ---------------------------------------------------------------------------
}

function asString(value: string | null | undefined): string | null {
  return typeof value === "string" && value ? value : null
}

export async function POST(request: Request) {
  const stripe = getHumanPolishStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Webhook not configured (missing STRIPE_SECRET_KEY)." },
      { status: 503 }
    )
  }

  const webhookSecret = getHumanPolishWebhookSecret()
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured (missing STRIPE_HP_WEBHOOK_SECRET)." },
      { status: 503 }
    )
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json(
      { error: "Webhook not configured (missing Supabase env)." },
      { status: 503 }
    )
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 })
  }

  // Raw body is required for signature verification.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error("[human-polish] webhook signature verification failed")
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Guard: only Human Polish one-time payments (spec §5.2). Never react to
        // subscription sessions here.
        if (session.mode !== "payment") break
        if (!isHumanPolishMetadata(session.metadata)) break

        // Only act once the money is actually captured.
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
          break
        }

        const requestId = session.metadata?.requestId
        if (!requestId) {
          console.error("[human-polish] webhook: checkout.session.completed missing requestId")
          break
        }

        await markRequestPaid(supabase, {
          requestId,
          sessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          customerId: typeof session.customer === "string" ? session.customer : null,
        })
        break
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent
        if (!isHumanPolishMetadata(pi.metadata)) break

        const requestId = pi.metadata?.requestId
        if (!requestId) {
          console.error("[human-polish] webhook: payment_intent.succeeded missing requestId")
          break
        }

        await markRequestPaid(supabase, {
          requestId,
          paymentIntentId: pi.id,
          customerId: typeof pi.customer === "string" ? pi.customer : null,
        })
        break
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent
        if (!isHumanPolishMetadata(pi.metadata)) break
        // The customer can retry from Checkout; the request stays in its pending
        // state. We do not downgrade status here to avoid clobbering retries.
        console.warn(
          "[human-polish] webhook: payment failed for request",
          asString(pi.metadata?.requestId) ?? "unknown"
        )
        break
      }

      default:
        // Ignore unrelated events (including all subscription events).
        break
    }
  } catch (error) {
    console.error("[human-polish] webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
