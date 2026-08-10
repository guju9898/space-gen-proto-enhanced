/**
 * Authenticate paid replacement-upload access for Human Polish uploads only.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { evaluateReplacementUploadAccess } from "./ops-guards"
import {
  hashReplacementUploadToken,
  replacementHashesEqual,
} from "./replacement-token"
import type { HumanPolishStatus } from "./types"

export type ReplacementUploadRequestRow = {
  id: string
  status: HumanPolishStatus
  payment_status: string
  family: string
  requested_package: string
  replacement_upload_token_hash: string | null
  replacement_upload_expires_at: string | null
  replacement_upload_issued_at: string | null
  [key: string]: unknown
}

export type ReplacementAuthResult =
  | { ok: true; request: ReplacementUploadRequestRow }
  | { ok: false; status: number; error: string; code?: "replacement_expired" }

const REPLACEMENT_SELECT =
  "id, status, payment_status, family, requested_package, replacement_upload_token_hash, replacement_upload_expires_at, replacement_upload_issued_at"

export async function authenticateReplacementUploadRequest(
  supabase: SupabaseClient,
  requestId: unknown,
  replacementToken: unknown
): Promise<ReplacementAuthResult> {
  if (typeof requestId !== "string" || !requestId.trim()) {
    return { ok: false, status: 400, error: "requestId is required." }
  }
  if (typeof replacementToken !== "string" || !replacementToken.trim()) {
    return { ok: false, status: 400, error: "replacementToken is required." }
  }

  const { data, error } = await supabase
    .from("human_polish_requests")
    .select(REPLACEMENT_SELECT)
    .eq("id", requestId.trim())
    .maybeSingle()

  if (error) {
    console.error("[human-polish] replacement upload lookup failed")
    return { ok: false, status: 500, error: "Unable to validate upload access." }
  }

  const providedHash = hashReplacementUploadToken(replacementToken.trim())
  const decision = evaluateReplacementUploadAccess({
    row: data
      ? {
          id: (data as ReplacementUploadRequestRow).id,
          family: (data as ReplacementUploadRequestRow).family,
          payment_status: (data as ReplacementUploadRequestRow).payment_status,
          status: (data as ReplacementUploadRequestRow).status,
          replacement_upload_token_hash: (data as ReplacementUploadRequestRow)
            .replacement_upload_token_hash,
          replacement_upload_expires_at: (data as ReplacementUploadRequestRow)
            .replacement_upload_expires_at,
        }
      : null,
    providedHash,
    hashesEqual: replacementHashesEqual,
  })

  if (!decision.ok) {
    return {
      ok: false,
      status: decision.status,
      error: decision.error,
      ...(decision.code ? { code: decision.code } : {}),
    }
  }

  return { ok: true, request: data as ReplacementUploadRequestRow }
}

/**
 * Soft page validation for the customer re-upload UI.
 * Same deny messaging whether the request is missing or the token is wrong.
 */
export async function validateReplacementUploadPageAccess(
  supabase: SupabaseClient,
  requestId: string,
  replacementToken: string
): Promise<
  | { ok: true; requestId: string; expiresAt: string | null }
  | { ok: false; error: string }
> {
  const auth = await authenticateReplacementUploadRequest(
    supabase,
    requestId,
    replacementToken
  )
  if (!auth.ok) {
    return { ok: false, error: "This upload link is invalid or has expired." }
  }
  return {
    ok: true,
    requestId: auth.request.id,
    expiresAt: auth.request.replacement_upload_expires_at,
  }
}
