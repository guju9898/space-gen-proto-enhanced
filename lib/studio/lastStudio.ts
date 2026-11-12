/** Remembers which Studio a person used last so `/studio` can reopen it. */
export const LAST_STUDIO_COOKIE = "rs_last_studio"

export const STUDIO_KINDS = ["landscape", "exterior", "interior"] as const
export type StudioKind = (typeof STUDIO_KINDS)[number]

/** Landscape is the default: pool, landscape and outdoor-living contractors are the main buyers. */
export const DEFAULT_STUDIO: StudioKind = "landscape"

export function parseStudioKind(value: string | null | undefined): StudioKind | null {
  return value && (STUDIO_KINDS as readonly string[]).includes(value) ? (value as StudioKind) : null
}

/** "/studio/exterior/..." → "exterior"; anything else → null. */
export function studioKindFromPath(pathname: string | null | undefined): StudioKind | null {
  const match = pathname?.match(/^\/studio\/([a-z]+)/)
  return parseStudioKind(match?.[1])
}

/**
 * Where `/studio` should go. Keeps the query string, so Stripe's
 * `/studio?billing=success` still opens the checkout-success dialog and the
 * demo's `/studio?demo=true` stays in demo mode.
 */
export function studioEntryHref(lastStudio: string | null | undefined, query: string): string {
  const kind = parseStudioKind(lastStudio) ?? DEFAULT_STUDIO
  const q = query.replace(/^\?/, "")
  return `/studio/${kind}${q ? `?${q}` : ""}`
}
