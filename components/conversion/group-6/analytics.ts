"use client"

export type AffiliateEventName =
  | "affiliate_referral_captured"
  | "affiliate_dashboard_viewed"
  | "affiliate_application_submitted"
  | "affiliate_link_copied"

const STATUSES = new Set(["captured", "ignored", "viewed", "submitted", "copied"])

export function trackAffiliateEvent(eventName: AffiliateEventName, status: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (window.location.pathname.startsWith("/admin")) return
  if (!STATUSES.has(status)) return
  window.gtag("event", eventName, { status })
}
