/**
 * Unified customer upload authorization: draft token OR replacement-upload token.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { authenticateDraftRequest, type HumanPolishRequestRow } from "./draft-auth"
import {
  authenticateReplacementUploadRequest,
  type ReplacementUploadRequestRow,
} from "./replacement-auth"

export type CustomerUploadAuthResult =
  | {
      ok: true
      mode: "draft" | "replacement"
      request: HumanPolishRequestRow | ReplacementUploadRequestRow
      expiresAt: string | null
    }
  | { ok: false; status: number; error: string; code?: string }

/**
 * Prefer replacementToken when present; otherwise draftToken.
 * Replacement auth never refreshes draft expiry and never authorizes non-upload flows.
 */
export async function authenticateCustomerUpload(
  supabase: SupabaseClient,
  body: Record<string, unknown>
): Promise<CustomerUploadAuthResult> {
  const hasReplacement =
    typeof body.replacementToken === "string" && body.replacementToken.trim().length > 0

  if (hasReplacement) {
    const auth = await authenticateReplacementUploadRequest(
      supabase,
      body.requestId,
      body.replacementToken
    )
    if (!auth.ok) {
      return {
        ok: false,
        status: auth.status,
        error: auth.error,
        ...(auth.code ? { code: auth.code } : {}),
      }
    }
    return {
      ok: true,
      mode: "replacement",
      request: auth.request,
      expiresAt: auth.request.replacement_upload_expires_at,
    }
  }

  const auth = await authenticateDraftRequest(supabase, body.requestId, body.draftToken)
  if (!auth.ok) {
    return {
      ok: false,
      status: auth.status,
      error: auth.error,
      ...(auth.code ? { code: auth.code } : {}),
    }
  }
  return {
    ok: true,
    mode: "draft",
    request: auth.request,
    expiresAt: auth.request.draft_expires_at,
  }
}
