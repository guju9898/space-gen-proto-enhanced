/**
 * Server-side Stripe price ID mapping.
 * Use STRIPE_PRICE_* env vars (server-only). Fallback to NEXT_PUBLIC_* for backward compatibility.
 * Price IDs are never hard-coded. Annual IDs stay unset until Stripe Prices are created.
 */

import type { BillingInterval, PlanCode } from "@/lib/pricing/catalog"

export type { PlanCode }

export const PLAN_CODES: PlanCode[] = ["intro", "professional", "business"]

export type StripePriceMap = {
  intro: string | null
  professional: string | null
  business: string | null
  professionalAnnual: string | null
  businessAnnual: string | null
}

function priceOrNull(value: string | undefined): string | null {
  if (!value || !value.startsWith("price_")) return null
  return value
}

/** Stripe price IDs by plan (from env). */
export function getStripePriceIds(env: Record<string, string | undefined> = process.env): StripePriceMap {
  return {
    intro: priceOrNull(env.STRIPE_PRICE_INTRO_WEEKLY),
    professional: priceOrNull(env.STRIPE_PRICE_PRO_MONTHLY ?? env.NEXT_PUBLIC_STRIPE_PRICE_PRO),
    business: priceOrNull(env.STRIPE_PRICE_BUSINESS_MONTHLY ?? env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS),
    professionalAnnual: priceOrNull(env.STRIPE_PRICE_PRO_ANNUAL),
    businessAnnual: priceOrNull(env.STRIPE_PRICE_BUSINESS_ANNUAL),
  }
}

export function getStripePriceId(planId: string, env?: Record<string, string | undefined>): string | null {
  const ids = getStripePriceIds(env)
  if (planId === "intro") return ids.intro
  if (planId === "professional") return ids.professional
  if (planId === "business") return ids.business
  return null
}

export function planCodeForPriceId(priceId: string, env?: Record<string, string | undefined>): PlanCode | null {
  const ids = getStripePriceIds(env)
  if (priceId && priceId === ids.intro) return "intro"
  if (priceId === ids.professional || priceId === ids.professionalAnnual) return "professional"
  if (priceId === ids.business || priceId === ids.businessAnnual) return "business"
  return null
}

export function annualCheckoutAvailable(
  plan: "professional" | "business",
  env?: Record<string, string | undefined>
): boolean {
  const ids = getStripePriceIds(env)
  return plan === "professional" ? ids.professionalAnnual !== null : ids.businessAnnual !== null
}

export type CheckoutPrice =
  | { ok: true; priceId: string; interval: BillingInterval }
  | { ok: false; error: "annual_unconfigured" | "missing_price" | "invalid_plan" }

/** Map a checkout request onto a verified Price ID. Annual is refused when unset. */
export function resolveCheckoutPrice(
  planId: string,
  requestedInterval: string | null | undefined,
  env?: Record<string, string | undefined>
): CheckoutPrice {
  if (planId !== "intro" && planId !== "professional" && planId !== "business") {
    return { ok: false, error: "invalid_plan" }
  }
  if (planId === "intro") {
    const priceId = getStripePriceId("intro", env)
    return priceId ? { ok: true, priceId, interval: "week" } : { ok: false, error: "missing_price" }
  }
  if (requestedInterval === "year") {
    const ids = getStripePriceIds(env)
    const priceId = planId === "professional" ? ids.professionalAnnual : ids.businessAnnual
    return priceId ? { ok: true, priceId, interval: "year" } : { ok: false, error: "annual_unconfigured" }
  }
  const priceId = getStripePriceId(planId, env)
  return priceId ? { ok: true, priceId, interval: "month" } : { ok: false, error: "missing_price" }
}

/** Old intro→Professional schedule. Off unless explicitly enabled. Existing schedules are not changed. */
export function introRollsIntoProfessional(env: Record<string, string | undefined> = process.env): boolean {
  return env.INTRO_ROLLS_INTO_PROFESSIONAL === "true"
}

export function shouldRefreshIntroCredits(input: {
  billingReason: string | null | undefined
  priceId: string | null | undefined
  introPriceId: string | null
}): boolean {
  return (
    input.billingReason === "subscription_cycle" &&
    !!input.introPriceId &&
    input.priceId === input.introPriceId
  )
}
