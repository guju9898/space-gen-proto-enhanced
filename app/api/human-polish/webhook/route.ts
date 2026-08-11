/**
 * POST /api/human-polish/webhook
 *
 * Dedicated Stripe webhook for Human Polish one-time payments.
 * Phase 7B: Build-Ready paid reconciliation validates approved amount +
 * payment_request_id version binding. AI Render Pack path unchanged.
 */

import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { evaluateBuildReadyWebhookPaid } from "@/lib/human-polish/build-ready-guards"
import { getDeliveryTarget, getFirstBatchSize } from "@/lib/human-polish/config"
import {
  sendInternalTeamAlertEmail,
  sendPaymentReceivedEmail,
} from "@/lib/human-polish/email"
import { buildFirstPaidTransitionFields } from "@/lib/human-polish/pack-expiration"
import {
  getHumanPolishStripe,
  getHumanPolishWebhookSecret,
  isHumanPolishMetadata,
} from "@/lib/human-polish/stripe"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  isAiRenderPackPackage,
  isHumanPolishPackage,
  isHumanPolishServiceFamily,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"

export const runtime = "nodejs"

type PaidUpdate = {
  requestId: string
  sessionId?: string | null
  paymentIntentId?: string | null
  customerId?: string | null
  amountTotalCents?: number | null
  currency?: string | null
  stripePaid: boolean
  metadata: Stripe.Metadata | null | undefined
  source: "checkout.session.completed" | "payment_intent.succeeded"
}

async function markRequestPaid(supabase: SupabaseClient, update: PaidUpdate): Promise<void> {
  const { requestId, sessionId, paymentIntentId, customerId } = update

  const { data: existing, error: readErr } = await supabase
    .from("human_polish_requests")
    .select(
      "id, status, payment_status, contact_email, contact_name, family, requested_package, approved_package, approved_amount, quoted_amount, currency, payment_request_id, stripe_checkout_session_id, paid_at, pack_expires_at"
    )
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
    return
  }

  const family: HumanPolishServiceFamily | null = isHumanPolishServiceFamily(existing.family)
    ? existing.family
    : null

  if (family === "build-ready") {
    const guard = evaluateBuildReadyWebhookPaid({
      family: existing.family,
      paymentStatus: existing.payment_status,
      status: existing.status,
      approvedPackage: existing.approved_package,
      approvedAmountCents: existing.approved_amount,
      paymentRequestId: existing.payment_request_id,
      storedCheckoutSessionId: existing.stripe_checkout_session_id,
      metadata: {
        productType: update.metadata?.productType,
        family: update.metadata?.family,
        requestId: update.metadata?.requestId,
        paymentRequestId: update.metadata?.paymentRequestId,
        approvedPackage: update.metadata?.approvedPackage,
      },
      eventRequestId: requestId,
      eventCheckoutSessionId:
        update.source === "checkout.session.completed" ? sessionId : null,
      amountTotalCents: update.amountTotalCents ?? null,
      currency: update.currency ?? null,
      stripePaid: update.stripePaid,
    })
    if (!guard.ok) {
      console.error("[human-polish] webhook: Build-Ready paid guard rejected", guard.error)
      return
    }
  } else if (family !== "ai-render-pack") {
    console.error("[human-polish] webhook: unknown family")
    return
  }

  const patch: Record<string, unknown> = {
    payment_status: "paid",
    status: "paid",
  }
  if (sessionId) patch.stripe_checkout_session_id = sessionId
  if (paymentIntentId) patch.stripe_payment_intent_id = paymentIntentId
  if (customerId) patch.stripe_customer_id = customerId

  const paidFields = buildFirstPaidTransitionFields({
    family: existing.family,
    existingPaidAt: (existing as { paid_at?: string | null }).paid_at ?? null,
    existingPackExpiresAt:
      (existing as { pack_expires_at?: string | null }).pack_expires_at ?? null,
  })
  Object.assign(patch, paidFields)

  if (family === "build-ready") {
    patch.build_ready_payment_token_hash = null
    patch.build_ready_payment_expires_at = null
    patch.build_ready_payment_issued_at = null
    // Preserve approved_*, scope_reviewed_*, payment_requested_at, payment_request_id.
  }

  const { error: updateErr, count } = await supabase
    .from("human_polish_requests")
    .update(patch, { count: "exact" })
    .eq("id", requestId)
    .neq("payment_status", "paid")

  if (updateErr) {
    console.error("[human-polish] webhook: failed to mark request paid")
    return
  }
  if (count === 0) return

  const pkg: HumanPolishPackage | null = isHumanPolishPackage(
    family === "build-ready" && existing.approved_package
      ? existing.approved_package
      : existing.requested_package
  )
    ? ((family === "build-ready" && existing.approved_package
        ? existing.approved_package
        : existing.requested_package) as HumanPolishPackage)
    : null
  const contactEmail =
    typeof existing.contact_email === "string" ? existing.contact_email : null

  if (family && pkg) {
    const packageLabel = HUMAN_POLISH_PACKAGE_LABELS[pkg]
    const amountCents =
      family === "build-ready" && typeof existing.approved_amount === "number"
        ? existing.approved_amount
        : typeof existing.quoted_amount === "number"
          ? existing.quoted_amount
          : undefined
    const currency = typeof existing.currency === "string" ? existing.currency : undefined
    const deliveryTarget = getDeliveryTarget(family, pkg) ?? undefined
    const firstBatchSize = isAiRenderPackPackage(pkg) ? getFirstBatchSize(pkg) : undefined

    const jobs: Promise<unknown>[] = []
    if (contactEmail) {
      jobs.push(
        sendPaymentReceivedEmail({
          to: contactEmail,
          contactName:
            typeof existing.contact_name === "string" ? existing.contact_name : undefined,
          requestId,
          family,
          packageLabel,
          amountCents,
          currency,
          deliveryTarget,
          firstBatchSize,
        })
      )
    }
    jobs.push(
      sendInternalTeamAlertEmail({
        subject: `Human Polish paid order (${packageLabel})`,
        requestId,
        summary: `family=${family} package=${pkg} paid`,
      })
    )
    await Promise.allSettled(jobs)
  }
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

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error("[human-polish] webhook signature verification failed")
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "payment") break
        if (!isHumanPolishMetadata(session.metadata)) break

        const stripePaid =
          session.payment_status === "paid" ||
          session.payment_status === "no_payment_required"
        if (!stripePaid) break

        const requestId = session.metadata?.requestId
        if (!requestId) {
          console.error("[human-polish] webhook: checkout.session.completed missing requestId")
          break
        }

        await markRequestPaid(supabase, {
          requestId,
          sessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          customerId: typeof session.customer === "string" ? session.customer : null,
          amountTotalCents:
            typeof session.amount_total === "number" ? session.amount_total : null,
          currency: session.currency ?? null,
          stripePaid,
          metadata: session.metadata,
          source: "checkout.session.completed",
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

        const amountReceived =
          typeof pi.amount_received === "number" && pi.amount_received > 0
            ? pi.amount_received
            : typeof pi.amount === "number"
              ? pi.amount
              : null

        await markRequestPaid(supabase, {
          requestId,
          paymentIntentId: pi.id,
          customerId: typeof pi.customer === "string" ? pi.customer : null,
          amountTotalCents: amountReceived,
          currency: pi.currency ?? null,
          stripePaid: true,
          metadata: pi.metadata,
          source: "payment_intent.succeeded",
        })
        break
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent
        if (!isHumanPolishMetadata(pi.metadata)) break
        console.warn(
          "[human-polish] webhook: payment failed for request",
          asString(pi.metadata?.requestId) ?? "unknown"
        )
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error("[human-polish] webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
