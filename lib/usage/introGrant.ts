import { CATALOG } from "@/lib/pricing/catalog"
import { logCreditError, type CreditErrorRow, type CreditErrorStage } from "@/lib/usage/creditErrors"

/**
 * user_usage primary key. period_start is a date, so an intro week and a
 * professional month that begin on the same calendar day need plan_code in the key.
 * Never upsert user_usage with onConflict "user_id" alone.
 */
export const USER_USAGE_CONFLICT = "user_id,period_start,plan_code"

export type IntroUsageGrant = {
  user_id: string
  plan_id: "intro"
  plan_code: "intro"
  period_start: string
  period_end: string
  credits_allocated: number
  credits_used: number
  updated_at: string
}

export function usagePeriodDate(value: string): string {
  return value.slice(0, 10)
}

export function introUsageGrant(input: {
  userId: string
  periodStart: string
  periodEnd: string
  now?: Date
}): IntroUsageGrant {
  return {
    user_id: input.userId,
    plan_id: "intro",
    plan_code: "intro",
    period_start: usagePeriodDate(input.periodStart),
    period_end: input.periodEnd,
    credits_allocated: CATALOG.intro.credits,
    credits_used: 0,
    updated_at: (input.now ?? new Date()).toISOString(),
  }
}

/** Fractional render costs (1.0, 1.5, 2.5) stay inside the allocated balance. */
export function creditsAfterConsumption(
  used: number,
  amount: number,
  allocated: number
): number | null {
  if (!Number.isFinite(used) || !Number.isFinite(amount) || !Number.isFinite(allocated)) return null
  if (amount <= 0 || allocated < 0) return null
  const next = Math.round((used + amount) * 100) / 100
  if (next > allocated) return null
  return next
}

type UsageWriteError = { code?: string; message?: string } | null

/** Supabase client or a test double. The query builder is thenable, so it is not typed as Promise. */
export type IntroGrantDb = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => PromiseLike<{ data: { user_id: string } | null; error: UsageWriteError }>
          }
        }
      }
    }
    insert: (row: IntroUsageGrant) => PromiseLike<{ error: UsageWriteError }>
  }
}

export type IntroGrantResult = { ok: true; granted: boolean } | { ok: false; error: string }

export type GrantIntroUsageOptions = {
  /** webhook_grant from Stripe; grant from self-heal or other writers */
  stage?: Extract<CreditErrorStage, "grant" | "webhook_grant">
  logError?: (row: CreditErrorRow) => Promise<void>
}

/**
 * Insert the intro allowance once per user and period date.
 * A retried webhook sees the row and does not reset credits_used.
 * Conflict target is always (user_id, period_start, plan_code), never user_id alone.
 */
export async function grantIntroUsage(
  db: IntroGrantDb,
  input: { userId: string; periodStart: string; periodEnd: string; now?: Date },
  options: GrantIntroUsageOptions = {}
): Promise<IntroGrantResult> {
  const stage = options.stage ?? "grant"
  const log = options.logError ?? logCreditError
  const periodStart = usagePeriodDate(input.periodStart)
  const { data: existing, error: readError } = await db
    .from("user_usage")
    .select("user_id")
    .eq("user_id", input.userId)
    .eq("plan_code", "intro")
    .eq("period_start", periodStart)
    .maybeSingle()

  if (readError) {
    const message = readError.message ?? "Could not read intro usage"
    await log({
      user_id: input.userId,
      plan_id: "intro",
      amount: CATALOG.intro.credits,
      stage,
      message,
    })
    return { ok: false, error: message }
  }
  if (existing) return { ok: true, granted: false }

  const { error } = await db.from("user_usage").insert(introUsageGrant({ ...input, periodStart }))
  if (error?.code === "23505") return { ok: true, granted: false }
  if (error) {
    const message = error.message ?? "Could not grant intro credits"
    await log({
      user_id: input.userId,
      plan_id: "intro",
      amount: CATALOG.intro.credits,
      stage,
      message,
    })
    return { ok: false, error: message }
  }
  return { ok: true, granted: true }
}
