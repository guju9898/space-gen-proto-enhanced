"use client"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type EventParams = Record<string, string | number | boolean | null | undefined>

/** Fire Human Polish GA events. Never pass PII (email, phone, name, address). */
export function trackHumanPolishEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", eventName, params ?? {})
}
