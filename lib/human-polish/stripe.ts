/**
 * Human Polish™ V1 — one-time-payment Stripe client and server-authoritative
 * pricing helpers.
 *
 * This module is completely independent from the Renderspace subscription Stripe
 * integration (`lib/stripe/plans.ts`, `app/api/stripe/**`). It must NEVER be used
 * to read or mutate subscription state.
 *
 * Money rules (single source of truth: `lib/human-polish/config.ts`):
 *   - All amounts are integer USD cents.
 *   - The browser never supplies a price, discount, rush approval, or tax amount.
 *   - Discounts never stack — the single best eligible offer is applied
 *     (docs/human-polish-v1-spec.md §2.1, §5).
 *
 * Server-only: never import from browser/client code.
 */

import Stripe from "stripe"
import {
  AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS,
  AI_RENDER_PACK_RUSH_FEE_CENTS,
  AI_RENDER_PACK_RUSH_TARGETS,
  AI_RENDER_PACK_STANDARD_PRICES_CENTS,
  AI_RENDER_PACK_SUBSCRIBER_PRICES_CENTS,
  getStandardAmountCents,
  HUMAN_POLISH_CURRENCY,
} from "./config"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  HUMAN_POLISH_SERVICE_FAMILY_LABELS,
  isAiRenderPackPackage,
  type HumanPolishPackage,
  type HumanPolishPromotionType,
  type HumanPolishServiceFamily,
} from "./types"

// ---------------------------------------------------------------------------
// Client + environment
// ---------------------------------------------------------------------------

/**
 * Stripe API version. Matches the existing subscription checkout
 * (`app/api/stripe/checkout/route.ts`) so both integrations behave identically.
 */
const STRIPE_API_VERSION = "2025-10-29.clover"

/** Durable metadata marker that guards the Human Polish payment branch. */
export const HUMAN_POLISH_PRODUCT_TYPE = "human_polish" as const

/**
 * Shared Stripe secret key with the subscription integration
 * (`STRIPE_SECRET_KEY`). Returns null when unconfigured so routes can respond 503.
 */
export function getHumanPolishStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION })
}

/**
 * Human-Polish-specific webhook signing secret. This is a DISTINCT endpoint
 * secret from the subscription webhook's `STRIPE_WEBHOOK_SECRET`.
 */
export function getHumanPolishWebhookSecret(): string | null {
  return process.env.STRIPE_HP_WEBHOOK_SECRET ?? null
}

/**
 * Stripe Tax product tax code applied to Human Polish line items. Human Polish
 * is a done-for-you visualization service; the default is Stripe's general
 * "Services" tax code. Override with `STRIPE_HP_TAX_CODE` if the account requires
 * a more specific classification.
 */
export function getHumanPolishTaxCode(): string {
  return process.env.STRIPE_HP_TAX_CODE?.trim() || "txcd_20030000"
}

// ---------------------------------------------------------------------------
// Amount computation (server-authoritative)
// ---------------------------------------------------------------------------

export type HumanPolishLineItemKind = "package" | "rush"

export type HumanPolishLineItem = {
  kind: HumanPolishLineItemKind
  label: string
  amountCents: number
}

export type ComputeAmountInput = {
  family: HumanPolishServiceFamily
  pkg: HumanPolishPackage
  /** True only for a 25-pack with no prior paid AI Render Pack for this phone. */
  firstPurchaseEligible: boolean
  /** True only for an authenticated, active Professional/Business subscriber. */
  subscriberEligible: boolean
  /** True only when the rush line item has been human-approved server-side. */
  rushApproved: boolean
  /**
   * Human-approved price for Build-Ready packages (custom quotes, or an approved
   * override on a standard package). Ignored for AI Render Packs.
   */
  approvedAmountCents?: number | null
}

export type HumanPolishAmountResult =
  | {
      ok: true
      lineItems: HumanPolishLineItem[]
      /** Best single package price after the winning discount (cents). */
      baseAmountCents: number
      /** Approved rush fee, or 0 (cents). */
      rushAmountCents: number
      /** baseAmountCents + rushAmountCents (before Stripe Tax). */
      totalBeforeTaxCents: number
      /** Undiscounted standard package price (cents). */
      standardAmountCents: number
      /** standardAmountCents - baseAmountCents (cents). */
      discountAmountCents: number
      promotionType: HumanPolishPromotionType
      subscriberDiscountApplied: boolean
    }
  | { ok: false; error: string }

/**
 * Compute the authoritative amount for a Human Polish checkout.
 *
 * All numbers come from `lib/human-polish/config.ts`. Discounts do not stack:
 * for the 25-pack the lowest of {standard, first-purchase, subscriber} wins; for
 * the 50/100 packs only the subscriber discount can apply (spec §2.1 / §5).
 */
export function computeHumanPolishAmount(input: ComputeAmountInput): HumanPolishAmountResult {
  const { family, pkg, firstPurchaseEligible, subscriberEligible, rushApproved } = input

  if (family === "ai-render-pack") {
    if (!isAiRenderPackPackage(pkg)) {
      return { ok: false, error: "Package does not belong to the AI Render Pack family." }
    }

    const standardAmountCents = AI_RENDER_PACK_STANDARD_PRICES_CENTS[pkg]

    // Pick the single best (lowest) eligible price — discounts never stack.
    let baseAmountCents = standardAmountCents
    let promotionType: HumanPolishPromotionType = "none"
    let subscriberDiscountApplied = false

    if (subscriberEligible) {
      const subCents = AI_RENDER_PACK_SUBSCRIBER_PRICES_CENTS[pkg]
      if (subCents < baseAmountCents) {
        baseAmountCents = subCents
        promotionType = "subscriber_15"
        subscriberDiscountApplied = true
      }
    }

    // First-purchase promo applies only to the 25-pack.
    if (firstPurchaseEligible && pkg === "25") {
      if (AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS < baseAmountCents) {
        baseAmountCents = AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS
        promotionType = "first_purchase_25"
        subscriberDiscountApplied = false
      }
    }

    const lineItems: HumanPolishLineItem[] = [
      {
        kind: "package",
        label: `AI Render Pack — ${HUMAN_POLISH_PACKAGE_LABELS[pkg]}`,
        amountCents: baseAmountCents,
      },
    ]

    // Rush fee is charged only when approved AND a fixed fee exists for the pack.
    // The 100-pack has custom rush terms (no automatic fee) — spec §2.1.
    const rushTarget = AI_RENDER_PACK_RUSH_TARGETS[pkg]
    const rushAmountCents = rushApproved && rushTarget ? AI_RENDER_PACK_RUSH_FEE_CENTS : 0
    if (rushAmountCents > 0) {
      lineItems.push({
        kind: "rush",
        label: `${rushTarget} (rush)`,
        amountCents: rushAmountCents,
      })
    }

    return {
      ok: true,
      lineItems,
      baseAmountCents,
      rushAmountCents,
      totalBeforeTaxCents: baseAmountCents + rushAmountCents,
      standardAmountCents,
      discountAmountCents: standardAmountCents - baseAmountCents,
      promotionType,
      subscriberDiscountApplied,
    }
  }

  // -------------------------------------------------------------------------
  // Build-Ready: no automatic promos/subscriber discounts. Requires a human-
  // approved price. Standard packages use the config price unless a human
  // approved a different amount; custom is always a manual quote.
  // -------------------------------------------------------------------------
  if (pkg === "custom") {
    const amt = input.approvedAmountCents ?? 0
    if (amt <= 0) {
      return {
        ok: false,
        error: "A custom Build-Ready quote must be approved before checkout.",
      }
    }
    return buildReadyResult(family, pkg, amt)
  }

  const standard = getStandardAmountCents(family, pkg)
  if (standard == null) {
    return { ok: false, error: "No standard price is configured for this package." }
  }
  const amount = input.approvedAmountCents && input.approvedAmountCents > 0 ? input.approvedAmountCents : standard
  return buildReadyResult(family, pkg, amount, standard)
}

function buildReadyResult(
  family: HumanPolishServiceFamily,
  pkg: HumanPolishPackage,
  amountCents: number,
  standardAmountCents: number = amountCents
): HumanPolishAmountResult {
  return {
    ok: true,
    lineItems: [
      {
        kind: "package",
        label: `${HUMAN_POLISH_SERVICE_FAMILY_LABELS[family]} — ${HUMAN_POLISH_PACKAGE_LABELS[pkg]}`,
        amountCents,
      },
    ],
    baseAmountCents: amountCents,
    rushAmountCents: 0,
    totalBeforeTaxCents: amountCents,
    standardAmountCents,
    discountAmountCents: Math.max(0, standardAmountCents - amountCents),
    promotionType: "none",
    subscriberDiscountApplied: false,
  }
}

// ---------------------------------------------------------------------------
// Stripe helpers
// ---------------------------------------------------------------------------

/**
 * Convert computed Human Polish line items into Stripe Checkout line items using
 * ad-hoc `price_data`. Tax is exclusive (added by Stripe Tax on top of the
 * displayed price — spec §5.4) and each line carries a tax code.
 */
export function toStripeLineItems(
  lineItems: HumanPolishLineItem[]
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const taxCode = getHumanPolishTaxCode()
  return lineItems.map((item) => ({
    quantity: 1,
    price_data: {
      currency: HUMAN_POLISH_CURRENCY,
      unit_amount: item.amountCents,
      tax_behavior: "exclusive",
      product_data: {
        name: item.label,
        tax_code: taxCode,
      },
    },
  }))
}

export type HumanPolishMetadataInput = {
  requestId: string
  family: HumanPolishServiceFamily
  pkg: HumanPolishPackage
  phoneNormalized: string | null
  promotionType: HumanPolishPromotionType
  subscriberDiscountApplied: boolean
  rushApproved: boolean
  leadSource: string | null
}

/**
 * Durable Stripe metadata for the Human Polish payment (spec §5.2). Attached to
 * BOTH the Checkout Session and the underlying PaymentIntent so either webhook
 * event can resolve the originating request. All values must be strings.
 */
export function buildHumanPolishMetadata(input: HumanPolishMetadataInput): Record<string, string> {
  return {
    productType: HUMAN_POLISH_PRODUCT_TYPE,
    requestId: input.requestId,
    family: input.family,
    package: input.pkg,
    phoneNormalized: input.phoneNormalized ?? "",
    promotionType: input.promotionType,
    subscriberDiscountApplied: String(input.subscriberDiscountApplied),
    rushApproved: String(input.rushApproved),
    leadSource: input.leadSource ?? "",
  }
}

/** True when a Stripe object's metadata marks it as a Human Polish payment. */
export function isHumanPolishMetadata(
  metadata: Stripe.Metadata | null | undefined
): metadata is Stripe.Metadata {
  return Boolean(metadata) && metadata?.productType === HUMAN_POLISH_PRODUCT_TYPE
}
