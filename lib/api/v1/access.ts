import type { SupabaseClient } from "@supabase/supabase-js"
import { enforceCredits, type CreditEnforcementResult } from "@/lib/usage/enforceCredits"
import { isUsableSubscriptionStatus } from "@/lib/usage/subscriptionStatus"

/** Public API access starts at Professional. Intro / First Job Test is not eligible. */
export const API_ELIGIBLE_PLANS = new Set(["professional", "business"])

export type ApiAccessResult =
  | { ok: true; planId: string; credits: CreditEnforcementResult }
  | { ok: false; code: "forbidden" | "payment_required"; message: string; credits?: CreditEnforcementResult }

export async function assertApiPlanAccess(
  db: SupabaseClient,
  userId: string
): Promise<ApiAccessResult> {
  const { data: profile, error } = await db
    .from("profiles")
    .select("current_plan, subscription_status")
    .eq("id", userId)
    .maybeSingle()

  if (error || !profile) {
    return { ok: false, code: "forbidden", message: "Account not found for this API key." }
  }

  const planId = typeof profile.current_plan === "string" ? profile.current_plan : null
  const status = profile.subscription_status as string | null

  if (!planId || !API_ELIGIBLE_PLANS.has(planId)) {
    return {
      ok: false,
      code: "forbidden",
      message: "Public API access requires an active Professional or Business plan.",
    }
  }

  if (!isUsableSubscriptionStatus(status)) {
    return {
      ok: false,
      code: "payment_required",
      message: "Subscription is not active. Update billing to use the API.",
    }
  }

  const credits = await enforceCredits(userId, { db: db as never })
  if (!credits.allow) {
    return {
      ok: false,
      code: "payment_required",
      message: credits.reason === "credits_exhausted" ? "Credits exhausted for this billing period." : "Credits unavailable for this account.",
      credits,
    }
  }

  return { ok: true, planId, credits }
}
