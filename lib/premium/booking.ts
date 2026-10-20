import { CITY_LABELS } from "@/lib/contractor-demo/cities"

/** Existing /book-demo lead form. City and source are the params that form already stores. */
export function premiumBookingHref(input?: { citySlug?: string | null; source?: string }): string {
  const params = new URLSearchParams()
  const source = input?.source && /^[a-z0-9-]{3,40}$/.test(input.source) ? input.source : "contractor-demo"
  params.set("source", source)
  const city = input?.citySlug?.trim().toLowerCase()
  if (city && CITY_LABELS[city]) params.set("city", city)
  return `/book-demo?${params.toString()}`
}
