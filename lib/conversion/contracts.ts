/**
 * Cross-group types for conversion work.
 *
 * This module is a contract, not a feature. It does not read Stripe, Supabase,
 * or the browser, and it does not decide eligibility. Implementations belong
 * to the groups named in docs/conversion-optimization/MASTER_SPEC.md.
 */

/** Key used by `lib/seo/facts.ts` (`PLANS`). */
export type MarketingPlanKey = "starter" | "professional" | "business"

/**
 * Plan id accepted by onboarding (`app/onboarding/page.tsx`) and by
 * `POST /api/stripe/checkout`. Marketing links that pass `plan=starter`
 * are ignored by onboarding, which only accepts these three values.
 */
export type CheckoutPlanCode = "intro" | "professional" | "business"

export const MARKETING_PLAN_TO_CHECKOUT: Record<MarketingPlanKey, CheckoutPlanCode> = {
  starter: "intro",
  professional: "professional",
  business: "business",
}

/** Query value for `/onboarding?plan=`. Never returns `starter`. */
export function onboardingPlanQuery(plan: MarketingPlanKey): CheckoutPlanCode {
  return MARKETING_PLAN_TO_CHECKOUT[plan]
}

/**
 * Promotions that already exist in the database or server config.
 * `NEW15` in `components/marketing/IntroPlanPromo.tsx` is not in this list:
 * checkout does not apply a coupon.
 */
export type ExistingPromotionType = "intro_offer" | "first_purchase_25" | "subscriber_15"

export type OfferIneligibilityReason =
  | "already_claimed"
  | "unauthenticated"
  | "not_subscriber"
  | "stacking_blocked"
  | "not_configured"

/** Group 4 displays this. Group 3 computes it on the server. */
export type OfferEligibility = {
  promotionType: ExistingPromotionType | "none"
  eligible: boolean
  reason?: OfferIneligibilityReason
}

/**
 * Minimum gallery-preset reference. Group 2 owns the full schema and storage.
 * Content-bot concepts already use `key` + `label` + `renderType`
 * (`lib/content/concepts.ts`). Published gallery rows are a different type
 * (`GalleryRender` in `lib/content/gallery.ts`).
 */
export type GalleryPresetRef = {
  key: string
  label: string
  renderType: "landscape" | "exterior" | "interior"
}

/**
 * Opaque affiliate code. Do not put an email, name, phone, or user id here.
 * `POST /api/stripe/checkout` already copies request fields `src` and `rep`
 * onto Stripe session metadata. That passthrough is not an affiliate system.
 */
export type AffiliateAttribution = {
  code: string
  capturedAt: string
}

/** Group 6 proposes. Group 3 decides and is the only writer of checkout. */
export type AffiliateDiscountDecision = {
  eligible: boolean
  /** Existing Stripe promotion code id (`promo_...`), or null. Do not invent one. */
  stripePromotionCodeId: string | null
}

export type PremiumServiceId = "human-polish" | "book-demo"

/** Group 5 owns availability. Other groups read it; they do not hardcode a second flag. */
export type PremiumServiceAvailability = {
  id: PremiumServiceId
  available: boolean
  href: string
}
