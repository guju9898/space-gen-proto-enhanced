import { normalizeAffiliateCode } from "@/lib/affiliates/codes"

export type AttributionDecision = {
  action: "bind" | "keep" | "skip"
  reason:
    | "ok"
    | "program_inactive"
    | "invalid_code"
    | "cookie_mismatch"
    | "expired"
    | "unapproved_partner"
    | "self_referral"
    | "already_attributed"
    | "override_blocked"
}

/**
 * First valid partner code wins. A later code cannot replace it.
 * The body code is accepted only when it matches the httpOnly cookie.
 */
export function decideAttribution(input: {
  programActive: boolean
  cookieCode: string | null
  cookieExpired?: boolean
  bodyCode?: string | null
  affiliateStatus: "approved" | "pending" | "rejected" | "suspended" | "missing"
  affiliateUserId: string | null
  customerUserId: string
  existingCode: string | null
}): AttributionDecision {
  if (!input.programActive) return { action: "skip", reason: "program_inactive" }
  const cookie = normalizeAffiliateCode(input.cookieCode)
  if (!cookie) {
    return { action: "skip", reason: input.cookieExpired ? "expired" : "invalid_code" }
  }
  if (input.bodyCode) {
    const body = normalizeAffiliateCode(input.bodyCode)
    if (!body || body !== cookie) return { action: "skip", reason: "cookie_mismatch" }
  }
  if (input.existingCode) {
    return {
      action: "keep",
      reason: input.existingCode === cookie ? "already_attributed" : "override_blocked",
    }
  }
  if (input.affiliateStatus !== "approved" || !input.affiliateUserId) {
    return { action: "skip", reason: "unapproved_partner" }
  }
  if (input.affiliateUserId === input.customerUserId) {
    return { action: "skip", reason: "self_referral" }
  }
  return { action: "bind", reason: "ok" }
}
