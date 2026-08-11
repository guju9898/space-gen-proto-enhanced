"use client"

/**
 * Lightweight blog analytics — separate from Human Polish typed allowlist.
 * Safe dimensions only: slug, category, destination.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackBlogEvent(
  eventName: "blog_post_viewed" | "blog_cta_clicked",
  params?: { slug?: string; category?: string; destination?: string }
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  const safe: Record<string, string> = {}
  if (params?.slug) safe.slug = params.slug
  if (params?.category) safe.category = params.category
  if (params?.destination) safe.destination = params.destination
  window.gtag("event", eventName, safe)
}
