"use client"

/**
 * Premium-service analytics. No names, emails, phones, or payment ids.
 */

export type PremiumEventName =
  | "premium_availability_viewed"
  | "premium_opening_requested"
  | "premium_service_inquiry"
  | "premium_booking_completed"

const PARAM_KEYS = new Set(["service", "status", "source", "city"])
const CITIES = new Set(["houston", "dallas", "austin", "generic"])

export function trackPremiumEvent(
  eventName: PremiumEventName,
  params?: Record<string, string | undefined>
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (window.location.pathname.startsWith("/admin")) return
  const safe: Record<string, string> = {}
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!PARAM_KEYS.has(key) || typeof value !== "string") continue
      const trimmed = value.trim().toLowerCase()
      if (!trimmed || trimmed.length > 40) continue
      if (key === "city" && !CITIES.has(trimmed)) continue
      safe[key] = trimmed
    }
  }
  window.gtag("event", eventName, safe)
}
