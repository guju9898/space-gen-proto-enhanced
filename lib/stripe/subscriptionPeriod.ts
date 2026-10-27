/** Stripe billing window. Newer API versions put the period on the subscription item. */

export type SubscriptionPeriod = {
  startIso: string
  endIso: string
}

type PeriodSource = {
  current_period_start?: number | null
  current_period_end?: number | null
  items?: {
    data?: Array<{
      current_period_start?: number | null
      current_period_end?: number | null
    }>
  } | null
}

export function readSubscriptionPeriod(source: PeriodSource | null | undefined): SubscriptionPeriod | null {
  const item = source?.items?.data?.[0]
  const start = source?.current_period_start ?? item?.current_period_start
  const end = source?.current_period_end ?? item?.current_period_end
  if (!start || !end) return null
  return {
    startIso: new Date(start * 1000).toISOString(),
    endIso: new Date(end * 1000).toISOString(),
  }
}

export function periodIsLive(endIso: string, nowMs = Date.now()): boolean {
  const end = Date.parse(endIso)
  return Number.isFinite(end) && end > nowMs
}
