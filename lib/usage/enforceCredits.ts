import { createClient } from "@supabase/supabase-js"

/**
 * SERVER-SIDE CREDIT ENFORCEMENT HELPER
 * 
 * Checks user's plan and monthly usage to determine if generation is allowed.
 * Uses profiles.current_plan as authoritative plan source.
 * 
 * Business plan users are never blocked.
 * Professional plan users are soft-blocked at limit.
 */

export type DenialReason = "no_plan" | "past_due" | "credits_exhausted" | "subscription_inactive"

export interface CreditEnforcementResult {
  allow: boolean
  nearLimit: boolean
  creditsRemaining: number | null
  periodStart: string
  planId: string | null
  monthlyLimit: number | null
  reason?: DenialReason
}

export async function enforceCredits(userId: string): Promise<CreditEnforcementResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Supabase configuration missing for credit enforcement")
    // Fail closed - deny if Supabase is misconfigured
    return {
      allow: false,
      nearLimit: false,
      creditsRemaining: 0,
      periodStart: new Date().toISOString().slice(0, 7), // YYYY-MM format
      planId: null,
      monthlyLimit: null,
      reason: "no_plan",
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Get current period start (first day of current month in UTC)
  const now = new Date()
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

    // Check subscription status - must be "active" to proceed
    if (profile.subscription_status !== "active") {
      console.warn(`⚠️ Subscription not active for user ${userId}, status: ${profile.subscription_status}`)
      const reason: DenialReason = profile.subscription_status === "past_due" ? "past_due" : "subscription_inactive"
      return {
        allow: false,
        nearLimit: false,
        creditsRemaining: 0,
        periodStart,
        planId: profile.current_plan,
        monthlyLimit: null,
        reason,
      }
    }

    let planId = profile.current_plan

    // Intro plan: credits from user_usage (plan_code=intro, period_end > now)
    if (planId === "intro") {
      const { data: introUsageRows } = await supabase
        .from("user_usage")
        .select("period_start, credits_allocated, credits_used, period_end")
        .eq("user_id", userId)
        .eq("plan_code", "intro")
        .gt("period_end", nowIso)
        .limit(1)

      const introRow = introUsageRows?.[0]
      if (!introRow) {
        return {
          allow: false,
          nearLimit: false,
          creditsRemaining: 0,
          periodStart,
          planId: "intro",
          monthlyLimit: null,
          reason: "credits_exhausted",
        }
      }

      const allocated =
        typeof introRow.credits_allocated === "number"
          ? introRow.credits_allocated
          : parseFloat(String(introRow.credits_allocated ?? 0))
      const used =
        typeof introRow.credits_used === "number"
          ? introRow.credits_used
          : parseFloat(String(introRow.credits_used ?? 0))
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
    const { data: usage, error: usageError } = await supabase
      .from("user_usage")
      .select("credits_used")
      .eq("user_id", userId)
      .eq("period_start", periodStart)
      .single()

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Supabase configuration missing for intro credit consumption")
    throw new Error("Intro credit consumption not configured")
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const nowIso = new Date().toISOString()
  const { data: row } = await supabase
    .from("user_usage")
    .select("period_start, credits_allocated, credits_used")
    .eq("user_id", userId)
    .eq("plan_code", "intro")
    .gt("period_end", nowIso)
    .limit(1)
    .single()

  if (!row) {
    throw new Error("Intro credits exhausted or period ended")
  }

  const used =
    typeof row.credits_used === "number" ? row.credits_used : parseFloat(String(row.credits_used ?? 0))
  const allocated =
    typeof row.credits_allocated === "number"
      ? row.credits_allocated
      : parseFloat(String(row.credits_allocated ?? 0))
  const newUsed = used + amount
  if (newUsed > allocated) {
    throw new Error("Intro credits exhausted")
  }

  const periodStart =
    typeof row.period_start === "string" ? row.period_start : new Date(row.period_start).toISOString()
  const { error } = await supabase
    .from("user_usage")
    .update({ credits_used: newUsed, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("period_start", periodStart)

  if (error) {
    console.error("❌ Error consuming intro credit:", error)
    throw new Error("Intro credit consumption failed")
  }
  console.log(`✅ Intro credit consumed for user ${userId}, amount: ${amount}, total used: ${newUsed}`)
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

/**
 * Record a render event for idempotency check
 * Returns true if event was successfully inserted (first time), false if duplicate
 */
export async function recordRenderEvent(
  userId: string,
  periodStart: string,
  renderId: string,
  cost: number
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Supabase configuration missing for render event recording")
    return false
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
        period_start: periodStart,
        render_id: renderId,
        cost: cost,
      })

    if (insertError) {
      // Check if it's a duplicate key error (unique constraint violation)
      if (insertError.code === "23505" || insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        console.log(`⚠️ Render event ${renderId} already exists - skipping credit consumption (idempotency)`)
        return false // Duplicate detected
      }
      console.error("❌ Error recording render event:", insertError)
      return false
    }

    console.log(`✅ Render event recorded: ${renderId}, cost: ${cost}`)
    return true // Successfully inserted (first time)
  } catch (error) {
    console.error("❌ Unexpected error recording render event:", error)
    return false
  }
}

/**
 * Consume credits after successful generation
 * Upserts into user_usage table, adding amount to existing credits_used
 * Supports fractional credits (e.g., 1.0, 1.5)
 */
export async function consumeCredit(
  userId: string,
  periodStart: string,
  amount: number
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Supabase configuration missing for credit consumption")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Get current usage
    const { data: existing } = await supabase
      .from("user_usage")
      .select("credits_used")
      .eq("user_id", userId)
      .eq("period_start", periodStart)
      .single()

    // Parse existing credits_used as number (handles both integer and decimal)
    const existingCredits = existing?.credits_used 
      ? (typeof existing.credits_used === "string" 
          ? parseFloat(existing.credits_used) 
          : Number(existing.credits_used))
      : 0

    const newCreditsUsed = existingCredits + amount

    // Upsert: insert or update credits_used
    const { error: upsertError } = await supabase
      .from("user_usage")
      .upsert(
        {
          user_id: userId,
          period_start: periodStart,
          credits_used: newCreditsUsed,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,period_start",
        }
      )

    if (upsertError) {
      console.error("❌ Error consuming credit:", upsertError)
    } else {
      console.log(`✅ Credit consumed for user ${userId}, period ${periodStart}, amount: ${amount}, total: ${newCreditsUsed}`)
    }
  } catch (error) {
    console.error("❌ Unexpected error consuming credit:", error)
  }
}

