/**
 * /human-polish/success?session_id=...
 *
 * Post-checkout confirmation. The Stripe Checkout Session is verified
 * SERVER-SIDE and cross-checked against the originating Human Polish request so a
 * fabricated or unrelated session id cannot expose another customer's data.
 *
 * Shows: payment received, package, request reference, delivery-clock note,
 * next step, and support info (spec §5.5).
 */

import Link from "next/link"
import { CheckCircle2, AlertTriangle, Clock, LifeBuoy } from "lucide-react"
import { getHumanPolishStripe, HUMAN_POLISH_PRODUCT_TYPE } from "@/lib/human-polish/stripe"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import { getDeliveryTarget } from "@/lib/human-polish/config"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  HUMAN_POLISH_SERVICE_FAMILY_LABELS,
  isHumanPolishPackage,
  isHumanPolishServiceFamily,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SuccessView =
  | { ok: false; reason: "missing" | "unverified" | "unconfigured" }
  | {
      ok: true
      requestId: string
      family: HumanPolishServiceFamily
      pkg: HumanPolishPackage
      deliveryTarget: string | null
    }

async function resolveSession(sessionId: string | undefined): Promise<SuccessView> {
  if (!sessionId) return { ok: false, reason: "missing" }

  const stripe = getHumanPolishStripe()
  const supabase = getHumanPolishSupabaseService()
  if (!stripe || !supabase) return { ok: false, reason: "unconfigured" }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Must be a paid Human Polish one-time payment.
    if (session.mode !== "payment") return { ok: false, reason: "unverified" }
    if (session.metadata?.productType !== HUMAN_POLISH_PRODUCT_TYPE) {
      return { ok: false, reason: "unverified" }
    }
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return { ok: false, reason: "unverified" }
    }

    const requestId = session.metadata?.requestId || session.client_reference_id
    if (!requestId) return { ok: false, reason: "unverified" }

    // Cross-check the session against the stored request so an unrelated (but
    // real) session id cannot surface a different customer's request.
    const { data: row, error } = await supabase
      .from("human_polish_requests")
      .select("id, family, requested_package, stripe_checkout_session_id")
      .eq("id", requestId)
      .maybeSingle()

    if (error || !row) return { ok: false, reason: "unverified" }
    if (
      row.stripe_checkout_session_id &&
      row.stripe_checkout_session_id !== session.id
    ) {
      return { ok: false, reason: "unverified" }
    }
    if (
      !isHumanPolishServiceFamily(row.family) ||
      !isHumanPolishPackage(row.requested_package)
    ) {
      return { ok: false, reason: "unverified" }
    }

    const family = row.family
    const pkg = row.requested_package
    return {
      ok: true,
      requestId: row.id,
      family,
      pkg,
      deliveryTarget: getDeliveryTarget(family, pkg),
    }
  } catch {
    return { ok: false, reason: "unverified" }
  }
}

export default async function HumanPolishSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const view = await resolveSession(session_id)

  return (
    <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        {view.ok ? (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
              <h1 className="text-3xl font-bold">Payment received</h1>
            </div>

            <p className="text-muted-foreground">
              Thank you — your payment is confirmed and your intake has been received. Our team will
              take it from here.
            </p>

            <dl className="grid grid-cols-1 gap-4 rounded-2xl border border-[#343434] bg-[#0d1119]/60 p-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Service</dt>
                <dd className="mt-1 font-medium">
                  {HUMAN_POLISH_SERVICE_FAMILY_LABELS[view.family]}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Package</dt>
                <dd className="mt-1 font-medium">{HUMAN_POLISH_PACKAGE_LABELS[view.pkg]}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Request reference
                </dt>
                <dd className="mt-1 font-mono text-sm">{view.requestId}</dd>
              </div>
            </dl>

            <div className="flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
              <div className="text-sm text-orange-100">
                <p className="font-medium">Your delivery clock hasn&apos;t started yet.</p>
                <p className="mt-1 text-orange-100/80">
                  It begins only after our team confirms your uploaded files and instructions are
                  complete and usable
                  {view.deliveryTarget ? `. Standard delivery target: ${view.deliveryTarget}.` : "."}
                  {" "}If anything is missing, we&apos;ll reach out before the clock starts.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#343434] bg-[#191f33]/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-white">What happens next</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>We review your files and brief for completeness.</li>
                <li>We confirm your files and start the delivery clock.</li>
                <li>You receive your first batch to confirm the brief was followed.</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LifeBuoy className="h-4 w-4" />
              <span>
                Questions? Email{" "}
                <a className="text-white underline" href="mailto:hello@renderspace.ai">
                  hello@renderspace.ai
                </a>{" "}
                and include your request reference.
              </span>
            </div>

            <div>
              <Link
                href="/human-polish"
                className="text-sm text-muted-foreground transition-colors hover:text-white"
              >
                ← Back to Human Polish™
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-300" />
              <h1 className="text-2xl font-bold">We couldn&apos;t verify this order</h1>
            </div>
            <p className="text-muted-foreground">
              {view.reason === "unconfigured"
                ? "Payments are not fully configured in this environment yet."
                : "This confirmation link is missing or could not be verified. If you just completed a payment, please check your email for a receipt, or contact us with any charge details."}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LifeBuoy className="h-4 w-4" />
              <span>
                Need help? Email{" "}
                <a className="text-white underline" href="mailto:hello@renderspace.ai">
                  hello@renderspace.ai
                </a>
                .
              </span>
            </div>
            <div>
              <Link
                href="/human-polish"
                className="text-sm text-muted-foreground transition-colors hover:text-white"
              >
                ← Back to Human Polish™
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
