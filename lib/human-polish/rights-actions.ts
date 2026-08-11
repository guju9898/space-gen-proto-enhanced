"use server"

import { revalidatePath } from "next/cache"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  evaluateRightsPermissionDecision,
  type RightsDecisionKind,
} from "@/lib/human-polish/rights-guards"
import {
  authenticateRightsPermissionRequest,
} from "@/lib/human-polish/rights-auth"
import { hashRightsPermissionToken, rightsHashesEqual } from "@/lib/human-polish/rights-token"

export type RightsCustomerActionResult = {
  ok: boolean
  error?: string
  decision?: "granted" | "declined"
}

/**
 * Customer Allow/Decline for portfolio permission.
 * Token-authenticated only — no Admin session required.
 */
export async function submitRightsPermissionDecision(input: {
  requestId: string
  token: string
  decision: RightsDecisionKind
}): Promise<RightsCustomerActionResult> {
  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return { ok: false, error: "Service temporarily unavailable." }
  }

  const auth = await authenticateRightsPermissionRequest(
    supabase,
    input.requestId,
    input.token
  )
  if (!auth.ok) {
    return {
      ok: false,
      error: "This permission link is invalid or has expired.",
    }
  }

  const evaluated = evaluateRightsPermissionDecision(input.decision)
  if (!evaluated.ok) {
    return { ok: false, error: evaluated.error }
  }

  const providedHash = hashRightsPermissionToken(input.token.trim())
  if (
    !auth.request.rights_permission_token_hash ||
    !rightsHashesEqual(providedHash, auth.request.rights_permission_token_hash)
  ) {
    return {
      ok: false,
      error: "This permission link is invalid or has expired.",
    }
  }

  const now = new Date().toISOString()
  const { data, error, count } = await supabase
    .from("human_polish_requests")
    .update(
      {
        rights_permission_status: evaluated.nextStatus,
        rights_permission_granted: evaluated.rightsPermissionGranted,
        rights_responded_at: now,
        rights_permission_token_hash: null,
        rights_permission_expires_at: null,
      },
      { count: "exact" }
    )
    .eq("id", auth.request.id)
    .eq("rights_permission_status", "requested")
    .eq("payment_status", "paid")
    .eq("status", "completed")
    .select("id")

  if (error) {
    console.error("[human-polish] rights decision update failed")
    return { ok: false, error: "Unable to record your decision. Please try again." }
  }
  if (!count || count === 0 || !data?.length) {
    return {
      ok: false,
      error: "This permission link is invalid or has already been used.",
    }
  }

  revalidatePath(`/human-polish/rights/${auth.request.id}`)
  revalidatePath(`/admin/human-polish/${auth.request.id}`)

  return { ok: true, decision: evaluated.nextStatus }
}
