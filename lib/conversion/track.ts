"use client"

/**
 * Analytics for new conversion events.
 *
 * Existing events stay on their current helpers. Do not retarget them:
 * - `components/human-polish/analytics.ts`
 * - `components/blog/analytics.ts`
 * - `components/contractor-demo/analytics.ts`
 *
 * New names: `{surface}_{action}` in snake_case, 2–40 characters, starting
 * with a letter. Examples: `pricing_plan_selected`, `gallery_preset_opened`.
 * Do not rename an event that is already in production.
 *
 * Parameters go through the Human Polish sanitizer, which drops email, phone,
 * name, address, tokens, request ids, and Stripe ids.
 */

import { sanitizeHumanPolishAnalyticsParams } from "@/lib/human-polish/analytics-params"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const EVENT_NAME = /^[a-z][a-z0-9_]{1,39}$/

export function isConversionEventName(eventName: string): boolean {
  return EVENT_NAME.test(eventName)
}

export function trackConversionEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isConversionEventName(eventName)) return
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  const safe = sanitizeHumanPolishAnalyticsParams(params)
  window.gtag("event", eventName, safe)
}
