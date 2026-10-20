"use client"

/**
 * Pricing analytics. No emails, card data, or Stripe session ids.
 */

export type PricingEventName =
  | "billing_interval_selected"
  | "plan_recommended"
  | "plan_selected"
  | "promo_viewed"
  | "pricing_checkout_started"

const PARAM_KEYS = new Set(["plan", "interval", "promotion_id", "status"])

export function trackPricingEvent(
  eventName: PricingEventName,
  params?: Record<string, string | undefined>
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (window.location.pathname.startsWith("/admin")) return
  const safe: Record<string, string> = {}
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!PARAM_KEYS.has(key) || typeof value !== "string") continue
      const trimmed = value.trim()
      if (!trimmed || trimmed.length > 40) continue
      safe[key] = trimmed
    }
  }
  window.gtag("event", eventName, safe)
}
