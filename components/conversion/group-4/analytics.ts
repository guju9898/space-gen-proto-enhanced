"use client"

/**
 * Lifecycle offer analytics. No emails, names, or payment identifiers.
 */

export type LifecycleEventName =
  | "lifecycle_offer_eligible"
  | "lifecycle_offer_viewed"
  | "lifecycle_offer_clicked"
  | "lifecycle_offer_dismissed"
  | "lifecycle_checkout_started"

const PARAM_KEYS = new Set(["offer_id", "trigger", "plan", "status"])

export function trackLifecycleEvent(
  eventName: LifecycleEventName,
  params?: Record<string, string | undefined>
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (window.location.pathname.startsWith("/admin")) return
  const safe: Record<string, string> = {}
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!PARAM_KEYS.has(key) || typeof value !== "string") continue
      const trimmed = value.trim()
      if (!trimmed || trimmed.length > 60) continue
      safe[key] = trimmed
    }
  }
  window.gtag("event", eventName, safe)
}
