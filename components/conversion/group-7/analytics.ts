"use client"

const LESSONS = new Set([
  "photographing-a-job-site",
  "creating-a-concept",
  "exploring-design-alternatives",
  "building-a-visual-proposal",
  "presenting-to-a-homeowner",
  "when-to-use-human-polish",
])

const DESTINATIONS = new Set(["guest_studio", "studio", "preset", "human_polish", "gallery", "demo_page"])

export type AcademyEventName = "academy_entered" | "academy_lesson_viewed" | "academy_studio_cta_clicked" | "academy_preset_selected"

export function trackAcademyEvent(
  eventName: AcademyEventName,
  params: { lesson?: string; destination?: string; preset?: string }
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  if (window.location.pathname.startsWith("/admin")) return
  const safe: Record<string, string> = {}
  if (params.lesson && LESSONS.has(params.lesson)) safe.lesson = params.lesson
  if (params.destination && DESTINATIONS.has(params.destination)) safe.destination = params.destination
  if (params.preset && /^[a-z0-9-]{3,80}$/.test(params.preset)) safe.preset = params.preset
  window.gtag("event", eventName, safe)
}
