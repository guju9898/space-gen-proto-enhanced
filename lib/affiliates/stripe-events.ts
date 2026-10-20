import type Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"
import { serializeAffiliateCookie } from "@/lib/affiliates/cookie"
import { affiliatesEnabled } from "@/lib/affiliates/config"
import { bindReferral, recordChargeRefund, recordDispute, recordSubscriptionPayment } from "@/lib/affiliates/service"

type InvoiceWithCharge = Stripe.Invoice & {
  charge?: string | { id?: string } | null
}

function chargeIdOf(value: string | { id?: string } | null | undefined): string | null {
  if (typeof value === "string") return value
  if (value && typeof value.id === "string") return value.id
  return null
}

function invoiceChargeId(invoice: InvoiceWithCharge): string | null {
  return chargeIdOf(invoice.charge)
}

/**
 * Books affiliate commissions from verified Stripe events.
 * Returns retry=true only when a live program write failed and Stripe should resend.
 * Subscription profile updates stay in the webhook and are not changed here.
 */
export async function syncAffiliateStripeEvent(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<{ retry: boolean }> {
  if (!affiliatesEnabled()) return { retry: false }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const code = session.metadata?.affiliate_code
      if (session.mode !== "subscription" || !userId || !code) return { retry: false }
      await bindReferral({
        supabase,
        userId,
        cookieValue: serializeAffiliateCookie(code, new Date()),
        bodyCode: code,
      })
      return { retry: false }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as InvoiceWithCharge
      if (invoice.status !== "paid" || invoice.amount_paid <= 0) return { retry: false }
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
      if (!customerId || !invoice.id) return { retry: false }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle()
      if (!profile?.id) return { retry: false }
      const paidAtSeconds = invoice.status_transitions?.paid_at
      return recordSubscriptionPayment({
        supabase,
        eventId: event.id,
        invoiceId: invoice.id,
        chargeId: invoiceChargeId(invoice),
        userId: profile.id,
        paidAt: paidAtSeconds ? new Date(paidAtSeconds * 1000) : new Date(),
        billingReason: invoice.billing_reason,
        currency: invoice.currency,
        amountPaidCents: invoice.amount_paid,
        totalCents: invoice.total,
        totalExcludingTaxCents: invoice.total_excluding_tax,
      })
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge & {
        invoice?: string | { id?: string } | null
      }
      const invoiceId = typeof charge.invoice === "string" ? charge.invoice : charge.invoice?.id ?? null
      return recordChargeRefund({
        supabase,
        eventId: event.id,
        invoiceId,
        chargeId: charge.id,
        amountPaidCents: charge.amount,
        amountRefundedCents: charge.amount_refunded,
      })
    }

    if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute
      const won = event.type === "charge.dispute.closed" && dispute.status === "won"
      if (won) return { retry: false }
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id
      return recordDispute({
        supabase,
        eventId: event.id,
        invoiceId: null,
        chargeId: chargeId ?? null,
        open: event.type === "charge.dispute.created",
      })
    }
  } catch {
    return { retry: true }
  }
  return { retry: false }
}
