/**
 * Canonical self-serve prices. Amounts were read from the live Stripe prices
 * on 2026-10-20. Do not display a different charge.
 *
 * Intro: price_…rbWgr4eQ is recurring, interval week, $19.99.
 * Professional: price_…6SKtS8Rv is recurring, interval month, $98.
 * Business: price_…EuXbyDQs is recurring, interval month, $349.
 *
 * Annual prices are not configured. The 20% figure is a proposal only.
 */

export type PlanCode = "intro" | "professional" | "business"
export type BillingInterval = "week" | "month" | "year"
export type FactsPlanKey = "starter" | "professional" | "business"

export type CatalogPlan = {
  code: PlanCode
  factsKey: FactsPlanKey
  name: string
  amountCents: number
  credits: number
  interval: Exclude<BillingInterval, "year">
  recurring: true
  /** Server env var that holds the live Stripe Price ID. Never the ID itself. */
  stripeEnv: "STRIPE_PRICE_INTRO_WEEKLY" | "STRIPE_PRICE_PRO_MONTHLY" | "STRIPE_PRICE_BUSINESS_MONTHLY"
  audience: "individual" | "team"
}

export const PROPOSED_ANNUAL_SAVINGS_PERCENT = 20

export const CATALOG: Record<PlanCode, CatalogPlan> = {
  intro: {
    code: "intro",
    factsKey: "starter",
    name: "First Job Test",
    amountCents: 1999,
    credits: 40,
    interval: "week",
    recurring: true,
    stripeEnv: "STRIPE_PRICE_INTRO_WEEKLY",
    audience: "individual",
  },
  professional: {
    code: "professional",
    factsKey: "professional",
    name: "Professional",
    amountCents: 9800,
    credits: 500,
    interval: "month",
    recurring: true,
    stripeEnv: "STRIPE_PRICE_PRO_MONTHLY",
    audience: "individual",
  },
  business: {
    code: "business",
    factsKey: "business",
    name: "Business",
    amountCents: 34900,
    credits: 6000,
    interval: "month",
    recurring: true,
    stripeEnv: "STRIPE_PRICE_BUSINESS_MONTHLY",
    audience: "team",
  },
}

export function dollarsFromCents(cents: number): number {
  return cents / 100
}

/** Proposed annual charge. Not a live price until a Stripe Price exists. */
export function proposedAnnualCents(monthlyCents: number, savingsPercent = PROPOSED_ANNUAL_SAVINGS_PERCENT): number {
  if (!Number.isInteger(monthlyCents) || monthlyCents < 0) return 0
  if (!Number.isInteger(savingsPercent) || savingsPercent < 0 || savingsPercent > 90) return 0
  return Math.round((monthlyCents * 12 * (100 - savingsPercent)) / 100)
}

export function savingsCents(monthlyCents: number, annualCents: number): number {
  const full = monthlyCents * 12
  return Math.max(0, full - annualCents)
}

export function moneyFromCents(cents: number): string {
  const dollars = cents / 100
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function intervalLabel(interval: BillingInterval): string {
  if (interval === "week") return "week"
  if (interval === "year") return "year"
  return "month"
}

export type IntroDisclosure = {
  chargedTodayCents: number
  renewal: string
  cancellation: string
  notOneTime: string
}

/** Copy that matches the weekly Stripe price. Rollover is a separate, opt-in schedule. */
export function introDisclosure(rollsIntoProfessional: boolean): IntroDisclosure {
  const intro = CATALOG.intro
  const professional = CATALOG.professional
  const renewal = rollsIntoProfessional
    ? `Unless you cancel, the subscription moves to ${professional.name} at ${moneyFromCents(professional.amountCents)} per month after one week.`
    : `It renews automatically at ${moneyFromCents(intro.amountCents)} every week until you cancel.`
  return {
    chargedTodayCents: intro.amountCents,
    renewal,
    cancellation: "Cancel anytime in billing settings before the next charge. Cancellation stops the next renewal.",
    notOneTime: "This is a recurring subscription, not a one-time purchase.",
  }
}
