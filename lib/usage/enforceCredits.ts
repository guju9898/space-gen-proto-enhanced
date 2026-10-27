import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { CATALOG } from "@/lib/pricing/catalog"
import { periodIsLive, readSubscriptionPeriod } from "@/lib/stripe/subscriptionPeriod"
import { logCreditError } from "@/lib/usage/creditErrors"
import { introUsageGrant } from "@/lib/usage/introGrant"
import { isUsableSubscriptionStatus } from "@/lib/usage/subscriptionStatus"

/**
 * SERVER-SIDE CREDIT ENFORCEMENT HELPER
 * 
 * Checks user's plan and monthly usage to determine if generation is allowed.
 * Uses profiles.current_plan as authoritative plan source.
 * 
 * Business plan users are never blocked.
 * Professional plan users are soft-blocked at limit.
 * Intro plan: 40 credits for the current Stripe billing period while status is active/trialing
 * (and legacy inactive, which older webhooks incorrectly stored for Stripe trialing).
 */

export type DenialReason = "no_plan" | "past_due" | "credits_exhausted" | "subscription_inactive" | "intro_period_ended"

export interface CreditEnforcementResult {
  allow: boolean
  nearLimit: boolean
  creditsRemaining: number | null
  periodStart: string
  planId: string | null
  monthlyLimit: number | null
  reason?: DenialReason
}

export { isUsableSubscriptionStatus } from "@/lib/usage/subscriptionStatus"

type UsageDb = SupabaseClient

type StripeSubscriptionSnapshot = {
  status: string
  current_period_start?: number | null
  current_period_end?: number | null
  items?: {
    data?: Array<{
      current_period_start?: number | null
      current_period_end?: number | null
    }>
  } | null
}

export type EnforceCreditsOptions = {
  db?: UsageDb
  now?: Date
  loadSubscription?: (subscriptionId: string) => Promise<StripeSubscriptionSnapshot | null>
}

function usageDb(): UsageDb | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceRoleKey) return null
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type IntroUsageRow = {
  period_start: string
  credits_allocated: number | string | null
  credits_used: number | string | null
  period_end: string
}

function asNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value
  return parseFloat(String(value ?? 0))
}

async function loadLiveIntroUsage(db: UsageDb, userId: string, nowIso: string): Promise<IntroUsageRow | null> {
  const { data } = await db
    .from("user_usage")
    .select("period_start, credits_allocated, credits_used, period_end")
    .eq("user_id", userId)
    .eq("plan_code", "intro")
    .gt("period_end", nowIso)
    .limit(1)
  return (data?.[0] as IntroUsageRow | undefined) ?? null
}

/**
 * Buyers who paid before plan_id was written have no user_usage row.
 * Recreate the 40-credit window from the live Stripe subscription period.
 */
async function healIntroUsage(
  db: UsageDb,
  userId: string,
  now: Date,
  loadSubscription: EnforceCreditsOptions["loadSubscription"]
): Promise<"granted" | "period_ended" | "unavailable"> {
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle()
  if (profileError || !profile?.stripe_subscription_id) {
    console.error(`Intro self-heal skipped for user ${userId}: no Stripe subscription on the profile`)
    return "unavailable"
  }

  const subscriptionId = profile.stripe_subscription_id as string
  let snapshot: StripeSubscriptionSnapshot | null = null
  if (loadSubscription) {
    snapshot = await loadSubscription(subscriptionId)
  } else {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      console.error(`Intro self-heal skipped for user ${userId}: Stripe is not configured`)
      return "unavailable"
    }
    try {
      const stripe = new Stripe(key)
      snapshot = await stripe.subscriptions.retrieve(subscriptionId)
    } catch (error) {
      console.error(`Intro self-heal could not read the Stripe subscription for user ${userId}`, error)
      return "unavailable"
    }
  }

  if (!snapshot || (snapshot.status !== "active" && snapshot.status !== "trialing")) {
    console.error(`Intro self-heal skipped for user ${userId}: subscription is not active`)
    return "unavailable"
  }

  const period = readSubscriptionPeriod(snapshot)
  if (!period || !periodIsLive(period.endIso, now.getTime())) {
    console.error(`Intro self-heal found an ended billing window for user ${userId}`)
    return "period_ended"
  }

  const grant = introUsageGrant({
    userId,
    periodStart: period.startIso,
    periodEnd: period.endIso,
    now,
  })
  const { error } = await db.from("user_usage").insert(grant)
  if (error && error.code !== "23505") {
    console.error(`Intro self-heal failed to write credits for user ${userId}: ${error.message}`)
    return "unavailable"
  }

  console.log(
    `Self-healed intro credits for user ${userId}: ${CATALOG.intro.credits} credits, period ends ${period.endIso}`
  )
  return "granted"
}

export async function enforceCredits(
  userId: string,
  options: EnforceCreditsOptions = {}
): Promise<CreditEnforcementResult> {
  const supabase = options.db ?? usageDb()
  const now = options.now ?? new Date()

  if (!supabase) {
    console.error("❌ Supabase configuration missing for credit enforcement")
    // Fail closed - deny if Supabase is misconfigured
    return {
      allow: false,
      nearLimit: false,
      creditsRemaining: 0,
      periodStart: now.toISOString().slice(0, 7), // YYYY-MM format
      planId: null,
      monthlyLimit: null,
      reason: "no_plan",
    }
  }

  const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`

  // Demo access: allow render if user has valid demo_access row (before paid subscription check)
  const nowIso = now.toISOString()
  const { data: demoRows } = await supabase
    .from("demo_access")
    .select("credits_allocated, credits_used, starts_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("starts_at", nowIso)
    .gt("expires_at", nowIso)

  const validDemo = demoRows?.find((row) => {
    const used = typeof row.credits_used === "number" ? row.credits_used : parseFloat(String(row.credits_used ?? 0))
    const allocated = typeof row.credits_allocated === "number" ? row.credits_allocated : parseFloat(String(row.credits_allocated ?? 0))
    return used < allocated
  })

  if (validDemo) {
    const allocated = typeof validDemo.credits_allocated === "number" ? validDemo.credits_allocated : parseFloat(String(validDemo.credits_allocated ?? 0))
    const used = typeof validDemo.credits_used === "number" ? validDemo.credits_used : parseFloat(String(validDemo.credits_used ?? 0))
    const creditsRemaining = Math.max(0, allocated - used)
    const nearLimit = creditsRemaining <= allocated * 0.1
    const demoPeriodStart = validDemo.starts_at ?? periodStart
    return {
      allow: true,
      nearLimit,
      creditsRemaining,
      periodStart: typeof demoPeriodStart === "string" ? demoPeriodStart : new Date(demoPeriodStart).toISOString(),
      planId: "demo",
      monthlyLimit: allocated,
    }
  }

  try {
    // Get user's plan and subscription status from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_plan, subscription_status")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.warn(`⚠️ Profile lookup failed for user ${userId}, denying access`)
      // Fail closed - deny if profile lookup fails
      return {
        allow: false,
        nearLimit: false,
        creditsRemaining: 0,
        periodStart,
        planId: null,
        monthlyLimit: null,
        reason: "no_plan",
      }
    }

    // Check if user has a plan
    if (!profile.current_plan) {
      console.warn(`⚠️ No plan found for user ${userId}, denying access`)
      return {
        allow: false,
        nearLimit: false,
        creditsRemaining: 0,
        periodStart,
        planId: null,
        monthlyLimit: null,
        reason: "no_plan",
      }
    }

    const subscriptionStatus = profile.subscription_status as string | null

    // Hard blocks — payment failure / canceled must never generate
    if (subscriptionStatus === "past_due") {
      console.warn(`⚠️ Subscription past_due for user ${userId}`)
      return {
        allow: false,
        nearLimit: false,
        creditsRemaining: 0,
        periodStart,
        planId: profile.current_plan,
        monthlyLimit: null,
        reason: "past_due",
      }
    }
    if (subscriptionStatus === "canceled") {
      console.warn(`⚠️ Subscription canceled for user ${userId}`)
      return {
        allow: false,
        nearLimit: false,
        creditsRemaining: 0,
        periodStart,
        planId: profile.current_plan,
        monthlyLimit: null,
        reason: "subscription_inactive",
      }
    }

    let planId = profile.current_plan

    // Intro weekly allowance: enforce credits from the current user_usage period.
    // Allow active, trialing, and legacy inactive (old webhook mapped trialing → inactive).
    if (planId === "intro") {
      if (
        !isUsableSubscriptionStatus(subscriptionStatus) &&
        subscriptionStatus !== "inactive" &&
        subscriptionStatus != null
      ) {
        console.warn(
          `⚠️ Intro subscription not usable for user ${userId}, status: ${subscriptionStatus}`
        )
        return {
          allow: false,
          nearLimit: false,
          creditsRemaining: 0,
          periodStart,
          planId: "intro",
          monthlyLimit: null,
          reason: "subscription_inactive",
        }
      }
      // fall through to intro credit window below
    } else if (!isUsableSubscriptionStatus(subscriptionStatus)) {
      // Professional / Business (and other non-intro plans): require active or trialing
      console.warn(
        `⚠️ Subscription not active for user ${userId}, status: ${subscriptionStatus}`
      )
      return {
        allow: false,
        nearLimit: false,
        creditsRemaining: 0,
        periodStart,
        planId: profile.current_plan,
        monthlyLimit: null,
        reason: "subscription_inactive",
      }
    }

      // Intro plan: credits from user_usage (plan_code=intro, period_end > now)
    if (planId === "intro") {
      let introRow = await loadLiveIntroUsage(supabase, userId, nowIso)
      if (!introRow && isUsableSubscriptionStatus(subscriptionStatus)) {
        const healed = await healIntroUsage(supabase, userId, now, options.loadSubscription)
        if (healed === "period_ended") {
          return {
            allow: false,
            nearLimit: false,
            creditsRemaining: 0,
            periodStart,
            planId: "intro",
            monthlyLimit: CATALOG.intro.credits,
            reason: "intro_period_ended",
          }
        }
        if (healed === "granted") introRow = await loadLiveIntroUsage(supabase, userId, nowIso)
      }
      if (!introRow) {
        return {
          allow: false,
          nearLimit: false,
          creditsRemaining: 0,
          periodStart,
          planId: "intro",
          monthlyLimit: CATALOG.intro.credits,
          reason: "credits_exhausted",
        }
      }

      const allocated = asNumber(introRow.credits_allocated)
      const used = asNumber(introRow.credits_used)
      const creditsRemaining = Math.max(0, allocated - used)
      const nearLimit = creditsRemaining <= allocated * 0.1
      const introPeriodStart =
        typeof introRow.period_start === "string"
          ? introRow.period_start
          : new Date(introRow.period_start).toISOString()

      return {
        allow: creditsRemaining > 0,
        nearLimit,
        creditsRemaining,
        periodStart: introPeriodStart,
        planId: "intro",
        monthlyLimit: allocated,
        reason: creditsRemaining > 0 ? undefined : "credits_exhausted",
      }
    }

    // Defensive whitelist: only 'professional' and 'business' are valid plans
    if (!planId || !["professional", "business"].includes(planId)) {
      planId = "professional"
    }

    // Business plan is never blocked
    if (planId === "business") {
      return {
        allow: true,
        nearLimit: false,
        creditsRemaining: null,
        periodStart,
        planId: "business",
        monthlyLimit: null,
      }
    }

    // Get plan's monthly limit from plans table
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("monthly_credits")
      .eq("id", planId)
      .single()

    if (planError || !plan?.monthly_credits) {
      console.warn(`⚠️ Plan ${planId} not found or missing monthly_limit, denying access`)
      // Fail closed if plan not found
      return {
        allow: false,
        nearLimit: false,
        creditsRemaining: 0,
        periodStart,
        planId,
        monthlyLimit: null,
        reason: "no_plan",
      }
    }

    const monthlyLimit = plan.monthly_credits

    // Get current month's usage from user_usage table
    const { data: usage } = await supabase
      .from("user_usage")
      .select("credits_used")
      .eq("user_id", userId)
      .eq("plan_code", planId)
      .eq("period_start", periodStart.slice(0, 10))
      .maybeSingle()

    // Parse credits_used as number (handles both integer and decimal)
    const creditsUsed = usage?.credits_used 
      ? (typeof usage.credits_used === "string" 
          ? parseFloat(usage.credits_used) 
          : Number(usage.credits_used))
      : 0
    const creditsRemaining = Math.max(0, monthlyLimit - creditsUsed)
    const nearLimit = creditsRemaining <= monthlyLimit * 0.1 // Within 10% of limit

    // Professional plan: block at/over limit (fail closed)
    // Business plan already handled above (always allow)
    const allow = creditsRemaining > 0

    return {
      allow,
      nearLimit,
      creditsRemaining,
      periodStart,
      planId,
      monthlyLimit,
      reason: allow ? undefined : "credits_exhausted",
    }
  } catch (error) {
    console.error("❌ Error in enforceCredits:", error)
    // Fail closed on error
    return {
      allow: false,
      nearLimit: false,
      creditsRemaining: 0,
      periodStart,
      planId: null,
      monthlyLimit: null,
      reason: "no_plan",
    }
  }
}

/**
 * Consume intro plan credits (updates user_usage row where plan_code='intro' and period_end > now).
 * Call only when creditCheck.planId === 'intro'.
 */
export async function consumeIntroCredit(userId: string, amount: number): Promise<void> {
  const supabase = usageDb()
  if (!supabase) {
    console.error("❌ Supabase configuration missing for intro credit consumption")
    throw new Error("Intro credit consumption not configured")
  }

  const nowIso = new Date().toISOString()
  const row = await loadLiveIntroUsage(supabase, userId, nowIso)
  if (!row) {
    throw new Error("Intro credits exhausted or period ended")
  }

  const periodStart = String(row.period_start).slice(0, 10)
  const { data, error } = await supabase.rpc("consume_user_credits", {
    p_user_id: userId,
    p_period_start: periodStart,
    p_plan_code: "intro",
    p_amount: amount,
    p_credits_allocated: null,
    p_uncapped: false,
  })

  if (error) {
    console.error(`❌ Error consuming intro credit for user ${userId}: ${error.message}`)
    throw new Error("Intro credit consumption failed")
  }
  const rows = Array.isArray(data) ? data : data ? [data] : []
  if (rows.length === 0) {
    throw new Error("Intro credits exhausted")
  }
  const total = asNumber((rows[0] as { credits_used?: number | string }).credits_used)
  console.log(`✅ Intro credit consumed for user ${userId}, amount: ${amount}, total used: ${total}`)
}

/**
 * Consume demo credits after successful generation.
 * Uses atomic RPC so that credits_used + amount <= credits_allocated is enforced in a single update.
 * Throws if no row was updated (demo credits exhausted or invalid window).
 */
export async function consumeDemoCredit(userId: string, amount: number): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Supabase configuration missing for demo credit consumption")
    throw new Error("Demo credit consumption not configured")
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: rows, error } = await supabase.rpc("consume_demo_credits", {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) {
    console.error("❌ Error consuming demo credit:", error)
    throw new Error("Demo credit consumption failed")
  }

  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    throw new Error("Demo credits exhausted")
  }

  const updated = Array.isArray(rows) ? rows[0] : rows
  console.log(`✅ Demo credit consumed for user ${userId}, amount: ${amount}, total used: ${(updated as { credits_used: number }).credits_used}`)
}

export type RenderEventWrite = "inserted" | "duplicate" | "failed"

/**
 * Record a render id so a retry does not charge twice.
 * Returns "duplicate" when this render was already stored.
 * Returns "failed" when the insert cannot be stored. The caller still charges that request
 * so a bookkeeping failure is not a free render. Once this insert works, the unique
 * (user_id, render_id) index makes the retry a duplicate instead of a second charge.
 */
export async function recordRenderEvent(
  userId: string,
  periodStart: string,
  renderId: string,
  cost: number
): Promise<RenderEventWrite> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[credits] render_event_failed", userId, null, renderId, cost, "Supabase is not configured")
    return "failed"
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Try to insert the render event
    const { error: insertError } = await supabase
      .from("user_render_events")
      .insert({
        user_id: userId,
        render_id: renderId,
        period_start: periodStart,
        cost: cost,
        credits_used: cost,
      })

    if (insertError) {
      if (insertError.code === "23505" || insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        console.log(`⚠️ Render event ${renderId} already exists - skipping credit consumption (idempotency)`)
        return "duplicate"
      }
      const message = insertError.message || "render event insert failed"
      console.error("[credits] render_event_failed", userId, null, renderId, cost, message)
      await logCreditError({
        user_id: userId,
        render_id: renderId,
        amount: cost,
        stage: "render_event",
        message,
      })
      return "failed"
    }

    console.log(`✅ Render event recorded: ${renderId}, cost: ${cost}`)
    return "inserted"
  } catch (error) {
    const message = error instanceof Error ? error.message : "render event insert failed"
    console.error("[credits] render_event_failed", userId, null, renderId, cost, message)
    await logCreditError({
      user_id: userId,
      render_id: renderId,
      amount: cost,
      stage: "render_event",
      message,
    })
    return "failed"
  }
}

/**
 * Record professional or business usage after a successful render.
 * plan_id is the profile's current plan. The increment is atomic and accepts fractional costs.
 */
export async function consumeCredit(
  userId: string,
  periodStart: string,
  amount: number
): Promise<void> {
  const supabase = usageDb()
  if (!supabase) {
    console.error("❌ Supabase configuration missing for credit consumption")
    throw new Error("Credit consumption not configured")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("current_plan")
    .eq("id", userId)
    .single()
  const planCode = profile?.current_plan
  if (profileError || !planCode) {
    console.error(`❌ Credit consumption failed for user ${userId}: no current plan`)
    throw new Error("Credit consumption failed")
  }

  let allocated: number | null = null
  const uncapped = planCode === "business"
  if (!uncapped) {
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("monthly_credits")
      .eq("id", planCode)
      .single()
    if (planError || plan?.monthly_credits == null) {
      console.error(`❌ Credit consumption failed for user ${userId}: plan ${planCode} has no allowance`)
      throw new Error("Credit consumption failed")
    }
    allocated = Number(plan.monthly_credits)
  }

  const { data, error } = await supabase.rpc("consume_user_credits", {
    p_user_id: userId,
    p_period_start: periodStart.slice(0, 10),
    p_plan_code: planCode,
    p_amount: amount,
    p_credits_allocated: allocated,
    p_uncapped: uncapped,
  })

  if (error) {
    console.error(`❌ Error consuming credit for user ${userId}: ${error.message}`)
    throw new Error("Credit consumption failed")
  }
  const rows = Array.isArray(data) ? data : data ? [data] : []
  if (rows.length === 0) {
    console.error(`❌ Credit consumption rejected for user ${userId}: allowance exceeded`)
    throw new Error("Credits exhausted")
  }
  const total = asNumber((rows[0] as { credits_used?: number | string }).credits_used)
  console.log(`✅ Credit consumed for user ${userId}, plan ${planCode}, amount: ${amount}, total: ${total}`)
}

