"use client"

/**
 * Gallery preset analytics. Same gtag property as the rest of the site.
 * Params are short strings only. Search text is not sent.
 */

import { ACTIVE_PRESET_STORAGE_KEY, isPresetSlug } from "@/lib/gallery/presets"

export type GalleryEventName =
  | "gallery_viewed"
  | "gallery_filter_applied"
  | "preset_opened"
  | "preset_studio_cta_clicked"
  | "preset_loaded"
  | "preset_render_completed"

const PARAM_KEYS = new Set(["preset_id", "category", "status", "filter", "has_query", "destination"])

export function trackGalleryEvent(
  eventName: GalleryEventName,
  params?: Record<string, string | undefined>
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (window.location.pathname.startsWith("/admin")) return
  const safe: Record<string, string> = {}
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!PARAM_KEYS.has(key) || typeof value !== "string") continue
      const trimmed = value.trim()
      if (!trimmed || trimmed.length > 80) continue
      safe[key] = trimmed
    }
  }
  window.gtag("event", eventName, safe)
}

export function trackPresetRenderCompleted(): void {
  if (typeof window === "undefined") return
  try {
    const slug = sessionStorage.getItem(ACTIVE_PRESET_STORAGE_KEY)
    if (!isPresetSlug(slug)) return
    trackGalleryEvent("preset_render_completed", { preset_id: slug })
  } catch {
    /* sessionStorage can throw in private modes */
  }
}
