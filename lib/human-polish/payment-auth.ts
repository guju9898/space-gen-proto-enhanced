/**
 * Authenticate Build-Ready payment-token access (view summary + Checkout only).
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { evaluateBuildReadyPaymentAccess } from "./build-ready-guards"
import {
  hashBuildReadyPaymentToken,
  paymentHashesEqual,
} from "./payment-token"
import type { HumanPolishStatus } from "./types"

export type BuildReadyPaymentRequestRow = {
  id: string
  status: HumanPolishStatus
  payment_status: string
  family: string
  requested_package: string
  approved_package: string | null
  approved_amount: number | null
  payment_request_id: string | null
  build_ready_payment_token_hash: string | null
  build_ready_payment_expires_at: string | null
  build_ready_payment_issued_at: string | null
  reviewer_message: string | null
  scope_reviewed_at: string | null
  stripe_checkout_session_id: string | null
  currency: string
  contact_email: string | null
  contact_name: string | null
  [key: string]: unknown
}

export type BuildReadyPaymentAuthResult =
  | { ok: true; request: BuildReadyPaymentRequestRow }
  | { ok: false; status: number; error: string; code?: "payment_expired" }

const PAYMENT_SELECT =
  "id, status, payment_status, family, requested_package, approved_package, approved_amount, payment_request_id, build_ready_payment_token_hash, build_ready_payment_expires_at, build_ready_payment_issued_at, reviewer_message, scope_reviewed_at, stripe_checkout_session_id, currency, contact_email, contact_name"

export async function authenticateBuildReadyPaymentRequest(
  supabase: SupabaseClient,
  requestId: unknown,
  paymentToken: unknown
): Promise<BuildReadyPaymentAuthResult> {
  if (typeof requestId !== "string" || !requestId.trim()) {
    return { ok: false, status: 400, error: "requestId is required." }
  }
  if (typeof paymentToken !== "string" || !paymentToken.trim()) {
    return { ok: false, status: 400, error: "paymentToken is required." }
  }

  const { data, error } = await supabase
    .from("human_polish_requests")
    .select(PAYMENT_SELECT)
    .eq("id", requestId.trim())
    .maybeSingle()

  if (error) {
    console.error("[human-polish] build-ready payment lookup failed")
    return { ok: false, status: 500, error: "Unable to validate payment access." }
  }

  const providedHash = hashBuildReadyPaymentToken(paymentToken.trim())
  const row = data as BuildReadyPaymentRequestRow | null
  const decision = evaluateBuildReadyPaymentAccess({
    row: row
      ? {
          id: row.id,
          family: row.family,
          payment_status: row.payment_status,
          status: row.status,
          approved_package: row.approved_package,
          approved_amount: row.approved_amount,
          payment_request_id: row.payment_request_id,
          build_ready_payment_token_hash: row.build_ready_payment_token_hash,
          build_ready_payment_expires_at: row.build_ready_payment_expires_at,
        }
      : null,
    providedHash,
    hashesEqual: paymentHashesEqual,
  })

  if (!decision.ok) {
    return {
      ok: false,
      status: decision.status,
      error: decision.error,
      ...(decision.code ? { code: decision.code } : {}),
    }
  }

  return { ok: true, request: row as BuildReadyPaymentRequestRow }
}

/** Soft page validation — uniform deny copy (no existence leakage). */
export async function validateBuildReadyPaymentPageAccess(
  supabase: SupabaseClient,
  requestId: string,
  paymentToken: string
): Promise<
  | {
      ok: true
      request: BuildReadyPaymentRequestRow
    }
  | { ok: false; error: string }
> {
  const auth = await authenticateBuildReadyPaymentRequest(
    supabase,
    requestId,
    paymentToken
  )
  if (!auth.ok) {
    return { ok: false, error: "This payment link is invalid or has expired." }
  }
  return { ok: true, request: auth.request }
}
