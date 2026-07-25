/**
 * Marketing-local presentation config for /human-polish.
 *
 * Machine-readable values (prices, package slugs, first-batch sizes, discount
 * percent, expiration, delivery targets) are sourced from the canonical shared
 * config in `lib/human-polish`. Only marketing-specific copy (CTA hrefs,
 * disclaimer text, assisted-sales contacts, formatting) lives here.
 */

import {
  AI_RENDER_PACK_PACKAGES,
  HUMAN_POLISH_PACKAGE_LABELS,
} from "@/lib/human-polish/types"
import {
  AI_RENDER_PACK_STANDARD_PRICES_CENTS,
  AI_RENDER_PACK_SUBSCRIBER_PRICES_CENTS,
  AI_RENDER_PACK_FIRST_BATCH_SIZES,
  AI_RENDER_PACK_DELIVERY_TARGETS,
  AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS,
  AI_RENDER_PACK_SUBSCRIBER_DISCOUNT_PERCENT,
  AI_RENDER_PACK_EXPIRATION_DAYS,
  BUILD_READY_STANDARD_PRICES_CENTS,
  BUILD_READY_DELIVERY_TARGETS,
} from "@/lib/human-polish/config"

const toDollars = (cents: number) => cents / 100

function intakeHref(family: "ai-render-pack" | "build-ready", pkg: string) {
  return `/human-polish/intake?family=${family}&package=${pkg}`
}

export const AI_RENDER_PACKS = AI_RENDER_PACK_PACKAGES.map((pkg) => ({
  packageId: pkg,
  label: HUMAN_POLISH_PACKAGE_LABELS[pkg],
  standardPrice: toDollars(AI_RENDER_PACK_STANDARD_PRICES_CENTS[pkg]),
  subscriberPrice: toDollars(AI_RENDER_PACK_SUBSCRIBER_PRICES_CENTS[pkg]),
  firstBatch: AI_RENDER_PACK_FIRST_BATCH_SIZES[pkg],
  delivery: AI_RENDER_PACK_DELIVERY_TARGETS[pkg],
  href: intakeHref("ai-render-pack", pkg),
}))

/** Convenience scalars for the 25-pack (used in promo/pricing copy). */
export const STANDARD_PRICE_25 = toDollars(AI_RENDER_PACK_STANDARD_PRICES_CENTS["25"])
export const SUBSCRIBER_PRICE_25 = toDollars(AI_RENDER_PACK_SUBSCRIBER_PRICES_CENTS["25"])

export const FIRST_PURCHASE_25_PRICE = toDollars(AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS)

const BUILD_READY_DISPLAY_ORDER = ["essentials-2d", "essentials-3d", "custom"] as const

export const BUILD_READY_PACKAGES = BUILD_READY_DISPLAY_ORDER.map((pkg) => ({
  packageId: pkg,
  label: HUMAN_POLISH_PACKAGE_LABELS[pkg],
  price: pkg === "custom" ? null : toDollars(BUILD_READY_STANDARD_PRICES_CENTS[pkg]),
  delivery: pkg === "custom" ? "Quoted after scope review" : BUILD_READY_DELIVERY_TARGETS[pkg],
  href: intakeHref("build-ready", pkg),
}))

export const ESSENTIALS_2D_PRICE = toDollars(BUILD_READY_STANDARD_PRICES_CENTS["essentials-2d"])
export const ESSENTIALS_3D_PRICE = toDollars(BUILD_READY_STANDARD_PRICES_CENTS["essentials-3d"])

export const PACK_EXPIRATION_DAYS = AI_RENDER_PACK_EXPIRATION_DAYS
export const SUBSCRIBER_DISCOUNT_PERCENT = AI_RENDER_PACK_SUBSCRIBER_DISCOUNT_PERCENT

/** Assisted-sales contacts. Real WhatsApp deep-link pending ops phone number. */
export const ASSISTED_SALES = {
  supportEmail: "frank@renderspace.ai",
  callMailto:
    "mailto:frank@renderspace.ai?subject=Human%20Polish%20%E2%80%94%20Call%20Request",
  whatsappMailto:
    "mailto:frank@renderspace.ai?subject=Human%20Polish%20%E2%80%94%20WhatsApp%20Request&body=Please%20reach%20me%20on%20WhatsApp.%20My%20number%20is%3A%20",
} as const

export const REQUIRED_DISCLAIMER =
  "Human Polish packages are intended for visualization, client presentation, and HOA/design-review support. They do not include architectural, structural, civil, or engineering services; professional seals; permit drawings; construction documents; or code-compliance certification."

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
