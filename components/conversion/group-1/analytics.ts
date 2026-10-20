"use client"

/**
 * Homepage experiment events. Same gtag guards as components/blog/analytics.ts.
 * Does not emit sign_up, begin_checkout, purchase, or generate_render.
 * Those names belong to feat/ga4-conversion-events and are not on this branch.
 */

import { HOME_EXPERIMENT_COOKIE, parseHomeVariant, type HomeVariant } from "./experiment"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export type HomepageEventName =
  | "homepage_viewed"
  | "hero_cta_clicked"
  | "guest_studio_started"
  | "first_render_completed"

type HomepageEventParams = {
  variant: HomeVariant
  destination?: "guest_studio" | "paid_plan" | "gallery"
  render_type?: "exterior"
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const parts = document.cookie.split("; ")
  for (const part of parts) {
    const eq = part.indexOf("=")
    if (eq === -1) continue
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1))
  }
  return null
}

export function readHomeVariantFromCookie(): HomeVariant | null {
  return parseHomeVariant(readCookie(HOME_EXPERIMENT_COOKIE))
}

export function trackHomepageEvent(eventName: HomepageEventName, params: HomepageEventParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (window.location.pathname.startsWith("/admin")) return
  const safe: Record<string, string> = { variant: params.variant }
  if (params.destination) safe.destination = params.destination
  if (params.render_type) safe.render_type = params.render_type
  window.gtag("event", eventName, safe)
}

const FIRST_RENDER_KEY = "rs_first_render_completed"

/** Once per browser session, and only for visitors who have an experiment assignment. */
export function trackFirstDemoRender(): void {
  const variant = readHomeVariantFromCookie()
  if (!variant) return
  try {
    if (window.sessionStorage.getItem(FIRST_RENDER_KEY) === "1") return
    window.sessionStorage.setItem(FIRST_RENDER_KEY, "1")
  } catch {
    // still fire once if storage is blocked; session may double-count
  }
  trackHomepageEvent("first_render_completed", { variant, render_type: "exterior" })
}
