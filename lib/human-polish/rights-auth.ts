/**
 * Authenticate portfolio rights-token access (Allow/Decline only).
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { evaluateRightsPermissionAccess } from "./rights-guards"
import {
  hashRightsPermissionToken,
  rightsHashesEqual,
} from "./rights-token"

export type RightsPermissionRequestRow = {
  id: string
  status: string
  payment_status: string
  family: string
  requested_package: string
  approved_package: string | null
  rights_permission_status: string
  rights_permission_token_hash: string | null
  rights_permission_expires_at: string | null
  rights_requested_at: string | null
  rights_responded_at: string | null
  rights_request_sent: boolean
  rights_permission_granted: boolean
  [key: string]: unknown
}

export type RightsPermissionAuthResult =
  | { ok: true; request: RightsPermissionRequestRow }
  | { ok: false; status: number; error: string; code?: "rights_expired" }

const RIGHTS_SELECT =
  "id, status, payment_status, family, requested_package, approved_package, rights_permission_status, rights_permission_token_hash, rights_permission_expires_at, rights_requested_at, rights_responded_at, rights_request_sent, rights_permission_granted"

export async function authenticateRightsPermissionRequest(
  supabase: SupabaseClient,
  requestId: unknown,
  rightsToken: unknown
): Promise<RightsPermissionAuthResult> {
  if (typeof requestId !== "string" || !requestId.trim()) {
    return { ok: false, status: 400, error: "requestId is required." }
  }
  if (typeof rightsToken !== "string" || !rightsToken.trim()) {
    return { ok: false, status: 400, error: "token is required." }
  }

  const { data, error } = await supabase
    .from("human_polish_requests")
    .select(RIGHTS_SELECT)
    .eq("id", requestId.trim())
    .maybeSingle()

  if (error) {
    console.error("[human-polish] rights permission lookup failed")
    return { ok: false, status: 500, error: "Unable to validate rights access." }
  }

  const providedHash = hashRightsPermissionToken(rightsToken.trim())
  const row = data as RightsPermissionRequestRow | null
  const decision = evaluateRightsPermissionAccess({
    row: row
      ? {
          id: row.id,
          payment_status: row.payment_status,
          status: row.status,
          rights_permission_status: row.rights_permission_status,
          rights_permission_token_hash: row.rights_permission_token_hash,
          rights_permission_expires_at: row.rights_permission_expires_at,
        }
      : null,
    providedHash,
    hashesEqual: rightsHashesEqual,
  })

  if (!decision.ok) {
    return {
      ok: false,
      status: decision.status,
      error: decision.error,
      ...(decision.code ? { code: decision.code } : {}),
    }
  }

  return { ok: true, request: row as RightsPermissionRequestRow }
}

/** Soft page validation — uniform deny copy (no existence leakage). */
export async function validateRightsPermissionPageAccess(
  supabase: SupabaseClient,
  requestId: string,
  rightsToken: string
): Promise<
  | { ok: true; request: RightsPermissionRequestRow }
  | { ok: false; error: string }
> {
  const auth = await authenticateRightsPermissionRequest(
    supabase,
    requestId,
    rightsToken
  )
  if (!auth.ok) {
    return {
      ok: false,
      error: "This permission link is invalid or has expired.",
    }
  }
  return { ok: true, request: auth.request }
}
