/**
 * City variants of /contractor-demo. Only these slugs exist; any other
 * /contractor-demo/<slug> returns 404 (dynamicParams = false).
 *
 * City pages are noindex until each has genuinely local content
 * (local project photos, climate/HOA/permit notes, a local testimonial,
 * local price ranges). Body copy is identical to /contractor-demo today.
 */
export const CITY_LABELS: Record<string, string> = {
  houston: "Houston",
  dallas: "Dallas",
  austin: "Austin",
}

export const CITY_SLUGS = Object.keys(CITY_LABELS)
