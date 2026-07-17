/**
 * Marketing-local pricing and CTA config.
 * Self-isolated so Foundation can later replace with shared lib/human-polish/config.
 */

export const AI_RENDER_PACKS = [
  {
    packageId: "25" as const,
    label: "25 concepts",
    standardPrice: 399,
    subscriberPrice: 339.15,
    firstBatch: 5,
    delivery: "24–48 hours",
    href: "/human-polish/intake?family=ai-render-pack&package=25",
  },
  {
    packageId: "50" as const,
    label: "50 concepts",
    standardPrice: 699,
    subscriberPrice: 594.15,
    firstBatch: 10,
    delivery: "48–72 hours",
    href: "/human-polish/intake?family=ai-render-pack&package=50",
  },
  {
    packageId: "100" as const,
    label: "100 concepts",
    standardPrice: 1199,
    subscriberPrice: 1019.15,
    firstBatch: 15,
    delivery: "3–5 business days",
    href: "/human-polish/intake?family=ai-render-pack&package=100",
  },
] as const

export const FIRST_PURCHASE_25_PRICE = 349

export const BUILD_READY_PACKAGES = [
  {
    packageId: "essentials-2d" as const,
    label: "Essentials 2D",
    price: 599,
    delivery: "3–5 business days",
    href: "/human-polish/intake?family=build-ready&package=essentials-2d",
  },
  {
    packageId: "essentials-3d" as const,
    label: "Essentials 3D",
    price: 899,
    delivery: "5–10 business days",
    href: "/human-polish/intake?family=build-ready&package=essentials-3d",
  },
  {
    packageId: "custom" as const,
    label: "Custom",
    price: null,
    delivery: "Quoted after scope review",
    href: "/human-polish/intake?family=build-ready&package=custom",
  },
] as const

export const PACK_EXPIRATION_DAYS = 90
export const SUBSCRIBER_DISCOUNT_PERCENT = 15

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
