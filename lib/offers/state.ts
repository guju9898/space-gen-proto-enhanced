export type LifecycleState = {
  impressions: Record<string, number>
  dismissedAt: Record<string, string>
  lastOfferId: string | null
  lastOfferAt: string | null
}

export const EMPTY_LIFECYCLE_STATE: LifecycleState = {
  impressions: {},
  dismissedAt: {},
  lastOfferId: null,
  lastOfferAt: null,
}

const OFFER_ID = /^[a-z0-9-]{3,60}$/

function cleanMap(value: unknown, numeric: boolean): Record<string, number> | Record<string, string> {
  if (!value || typeof value !== "object") return {}
  const out: Record<string, number | string> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (!OFFER_ID.test(key)) continue
    if (numeric) {
      const count = typeof raw === "number" ? raw : Number(raw)
      if (Number.isInteger(count) && count > 0 && count < 100) out[key] = count
    } else if (typeof raw === "string" && Number.isFinite(Date.parse(raw))) {
      out[key] = raw
    }
  }
  return out as Record<string, number>
}

export function parseLifecycleState(raw: string | null | undefined): LifecycleState {
  if (!raw) return { ...EMPTY_LIFECYCLE_STATE, impressions: {}, dismissedAt: {} }
  try {
    const parsed = JSON.parse(raw) as Partial<LifecycleState>
    const lastOfferId = typeof parsed.lastOfferId === "string" && OFFER_ID.test(parsed.lastOfferId) ? parsed.lastOfferId : null
    const lastOfferAt = typeof parsed.lastOfferAt === "string" && Number.isFinite(Date.parse(parsed.lastOfferAt)) ? parsed.lastOfferAt : null
    return {
      impressions: cleanMap(parsed.impressions, true) as Record<string, number>,
      dismissedAt: cleanMap(parsed.dismissedAt, false) as Record<string, string>,
      lastOfferId,
      lastOfferAt,
    }
  } catch {
    return { ...EMPTY_LIFECYCLE_STATE, impressions: {}, dismissedAt: {} }
  }
}

export function serializeLifecycleState(state: LifecycleState): string {
  return JSON.stringify(parseLifecycleState(JSON.stringify(state)))
}

export function recordLifecycleEvent(
  state: LifecycleState,
  event: "impression" | "dismiss",
  offerId: string,
  now: Date
): LifecycleState {
  if (!OFFER_ID.test(offerId)) return state
  const next = parseLifecycleState(serializeLifecycleState(state))
  if (event === "impression") {
    next.impressions[offerId] = Math.min(99, (next.impressions[offerId] ?? 0) + 1)
    next.lastOfferId = offerId
    next.lastOfferAt = now.toISOString()
  } else {
    next.dismissedAt[offerId] = now.toISOString()
  }
  return next
}
