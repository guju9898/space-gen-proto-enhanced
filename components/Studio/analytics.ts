"use client"

/**
 * Studio funnel events (spec section J). Same gtag property as the rest of the site.
 * Only short labels are sent: never prompts, typed text, emails or image URLs.
 */
export type StudioEventName =
  | "studio_opened"
  | "photo_uploaded"
  | "render_started"
  | "render_completed"
  | "render_failed"
  | "custom_value_entered"
  | "more_options_opened"
  | "no_photo_mode_selected"
  | "camera_controls_shown"

const PARAM_KEYS = new Set(["studio", "mode", "device", "field", "has_photo", "version", "studio_version"])

export function trackStudioEvent(eventName: StudioEventName, params?: Record<string, string | number | boolean | undefined>): void {
  if (typeof window === "undefined") return
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== "function") return
  const safe: Record<string, string> = {}
  for (const [key, value] of Object.entries(params ?? {})) {
    if (!PARAM_KEYS.has(key) || value === undefined) continue
    const text = String(value).trim()
    if (text && text.length <= 60) safe[key] = text
  }
  gtag("event", eventName, safe)
}
