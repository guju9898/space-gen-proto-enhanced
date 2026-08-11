"use client"

/**
 * Human Polish GA helper — typed, non-PII event contract (Phase 8B).
 * Never pass email, phone, name, address, tokens, requestId, or Stripe IDs.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

import { sanitizeHumanPolishAnalyticsParams } from "@/lib/human-polish/analytics-params"
import type {
  HumanPolishPackage,
  HumanPolishPromotionType,
  HumanPolishServiceFamily,
} from "@/lib/human-polish/types"

export type HumanPolishAnalyticsEventMap = {
  viewed_human_polish: Record<string, never>
  selected_service_family: { family: HumanPolishServiceFamily }
  selected_render_pack: { package: HumanPolishPackage; family: "ai-render-pack" }
  clicked_build_ready: { family: "build-ready"; package: HumanPolishPackage }
  clicked_custom_quote: { family: "build-ready"; package: HumanPolishPackage }
  started_intake: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  created_intake_draft: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  uploaded_files: {
    family: HumanPolishServiceFamily
    package: HumanPolishPackage
    count: number
  }
  completed_intake: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  accepted_scope: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  viewed_order_summary: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  requested_rush: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  requested_call: { source: "assisted_sales" | "intake" }
  clicked_whatsapp: { source: "assisted_sales" | "intake" }
  initiated_checkout: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  completed_checkout: {
    family: HumanPolishServiceFamily
    package: HumanPolishPackage
    promotionType?: HumanPolishPromotionType
  }
  checkout_cancelled: { family: HumanPolishServiceFamily; package: HumanPolishPackage }
  first_purchase_promo_viewed: { package: "25" }
  first_purchase_promo_applied: {
    family: "ai-render-pack"
    package: HumanPolishPackage
    promotionType: "first_purchase_25"
  }
  subscriber_discount_applied: {
    family: "ai-render-pack"
    package: HumanPolishPackage
    promotionType: "subscriber_15"
  }
}

export type HumanPolishAnalyticsEventName = keyof HumanPolishAnalyticsEventMap

export { sanitizeHumanPolishAnalyticsParams }

export function trackHumanPolishEvent<E extends HumanPolishAnalyticsEventName>(
  eventName: E,
  params?: HumanPolishAnalyticsEventMap[E]
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  const safe = sanitizeHumanPolishAnalyticsParams(
    params as Record<string, unknown> | undefined
  )
  window.gtag("event", eventName, safe)
}

/** sessionStorage dedupe for verified success analytics (session id never sent to GA). */
export function shouldFireHumanPolishSuccessAnalytics(sessionId: string): boolean {
  if (typeof window === "undefined") return false
  if (!sessionId.trim()) return false
  try {
    const key = `hp_checkout_success_${sessionId}`
    if (window.sessionStorage.getItem(key) === "1") return false
    window.sessionStorage.setItem(key, "1")
    return true
  } catch {
    return true
  }
}
