/**
 * Product facts used in metadata, FAQ copy and structured data.
 *
 * Rule: if a price, credit count, turnaround or license term appears in SEO
 * copy or JSON-LD, it comes from here. Self-serve plan prices are charged by
 * Stripe (see lib/stripe/plans.ts for price IDs). Keep these in sync with the
 * Stripe dashboard when prices change.
 *
 * Human Polish prices are NOT duplicated: they're imported from the
 * server-authoritative lib/human-polish/config.ts.
 */

import {
  AI_RENDER_PACK_DELIVERY_TARGETS,
  AI_RENDER_PACK_STANDARD_PRICES_CENTS,
  BUILD_READY_DELIVERY_TARGETS,
  BUILD_READY_STANDARD_PRICES_CENTS,
} from "@/lib/human-polish/config"
import { HUMAN_POLISH_PACKAGE_LABELS } from "@/lib/human-polish/types"

/**
 * Official profiles, shown in the site footer and used as Organization sameAs.
 * Leave url empty until a profile is live; empty entries are hidden everywhere.
 */
export const SOCIAL_PROFILES = [
  { key: "instagram", name: "Instagram", url: "https://www.instagram.com/renderspace_ai/" },
  { key: "capterra", name: "Capterra", url: "" },
  { key: "g2", name: "G2", url: "" },
] as const

export const LIVE_PROFILES = SOCIAL_PROFILES.filter((p) => p.url.length > 0)

export const SITE = {
  name: "Renderspace",
  url: "https://www.renderspace.ai",
  logoPath: "/amethyst-flow.png",
  logoSize: 1024,
  founder: "KeSean Fallon",
  sameAs: LIVE_PROFILES.map((p) => p.url) as readonly string[],
} as const

/**
 * Usage rights (decided 2026-10-14): every paid plan may use renders for
 * proposals, presentations, websites, social media and ads. Not allowed:
 * selling or licensing the images themselves to third parties.
 */
export const USAGE_RIGHTS =
  "Use renders in proposals, presentations, your website, social media and ads. Reselling or licensing the images themselves to third parties is not allowed."

/** Proof points KeSean can stand behind publicly. */
export const PROOF = {
  /** Display as "10,000+" in UI; "more than 10,000" in sentences. */
  rendersGenerated: "10,000",
  /** Typical photo-to-concept time; comparison table says 20–40 seconds. */
  secondsPerConcept: { typical: 30, min: 20, max: 40 },
} as const

/** Uploaded source photos are deleted from the account after this many days. */
export const UPLOAD_RETENTION_DAYS = 30

export const UPLOAD_LIMITS = { formats: "JPG, PNG or WEBP", maxMb: 10 } as const

export type PlanKey = "starter" | "professional" | "business"

export type Plan = {
  key: PlanKey
  name: string
  priceUsd: number
  credits: number
  /** "7 days" for the one-time trial; "month" for subscriptions. */
  period: "7 days" | "month"
  recurring: boolean
  resolution: "4K"
  /** Usage rights for renders made on this plan. */
  license: string
}

export const PLANS: Record<PlanKey, Plan> = {
  starter: {
    key: "starter",
    name: "First Job Test",
    priceUsd: 19.99,
    credits: 40,
    period: "7 days",
    recurring: false,
    resolution: "4K",
    license: USAGE_RIGHTS,
  },
  professional: {
    key: "professional",
    name: "Professional",
    priceUsd: 99,
    credits: 500,
    period: "month",
    recurring: true,
    resolution: "4K",
    license: USAGE_RIGHTS,
  },
  business: {
    key: "business",
    name: "Business",
    priceUsd: 349,
    credits: 6000,
    period: "month",
    recurring: true,
    resolution: "4K",
    license: USAGE_RIGHTS,
  },
}

/** "$19.99", "$99", "$1,199" */
export function usd(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/** "6,000" */
export function count(n: number): string {
  return n.toLocaleString("en-US")
}

export type ServicePackage = {
  id: string
  name: string
  priceUsd: number
  delivery: string
}

export const HUMAN_POLISH_RENDER_PACKS: ServicePackage[] = (
  Object.keys(AI_RENDER_PACK_STANDARD_PRICES_CENTS) as (keyof typeof AI_RENDER_PACK_STANDARD_PRICES_CENTS)[]
).map((pkg) => ({
  id: `render-pack-${pkg}`,
  name: `AI Render Pack: ${HUMAN_POLISH_PACKAGE_LABELS[pkg]}`,
  priceUsd: AI_RENDER_PACK_STANDARD_PRICES_CENTS[pkg] / 100,
  delivery: AI_RENDER_PACK_DELIVERY_TARGETS[pkg],
}))

export const HUMAN_POLISH_BUILD_READY: ServicePackage[] = (
  Object.keys(BUILD_READY_STANDARD_PRICES_CENTS) as (keyof typeof BUILD_READY_STANDARD_PRICES_CENTS)[]
).map((pkg) => ({
  id: `build-ready-${pkg}`,
  name: `Build-Ready ${HUMAN_POLISH_PACKAGE_LABELS[pkg]}`,
  priceUsd: BUILD_READY_STANDARD_PRICES_CENTS[pkg] / 100,
  delivery: BUILD_READY_DELIVERY_TARGETS[pkg],
}))
