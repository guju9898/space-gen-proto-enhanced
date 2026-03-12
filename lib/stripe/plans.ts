/**
 * Server-side Stripe price ID mapping.
 * Use STRIPE_PRICE_* env vars (server-only). Fallback to NEXT_PUBLIC_* for backward compatibility.
 */

export type PlanCode = "intro" | "professional" | "business"

export const PLAN_CODES: PlanCode[] = ["intro", "professional", "business"]

/** Stripe price IDs by plan (from env). */
export function getStripePriceIds(): Record<PlanCode, string | null> {
  return {
    intro:
      process.env.STRIPE_PRICE_INTRO_WEEKLY ?? null,
    professional:
      process.env.STRIPE_PRICE_PRO_MONTHLY ??
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ??
      null,
    business:
      process.env.STRIPE_PRICE_BUSINESS_MONTHLY ??
      process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ??
      null,
  }
}

export function getStripePriceId(planId: string): string | null {
  const ids = getStripePriceIds()
  if (planId === "intro") return ids.intro
  if (planId === "professional") return ids.professional
  if (planId === "business") return ids.business
  return null
}
