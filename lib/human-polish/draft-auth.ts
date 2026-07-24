/**
 * Draft request access helpers — verify recovery token against stored hash.
 *
 * Draft expiration is inactivity-based: a successful authenticated action
 * extends draft_expires_at by HUMAN_POLISH_DRAFT_TTL_MS from "now".
 * Failed / expired / invalid tokens never refresh the window.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { draftExpiresAt, hashDraftToken, hashesEqual } from "./draft-token"
import type { HumanPolishStatus } from "./types"

export type HumanPolishRequestRow = {
  id: string
  status: HumanPolishStatus
  draft_token_hash: string | null
  draft_expires_at: string | null
  family: string
  requested_package: string
  [key: string]: unknown
}

export type DraftAuthResult =
  | { ok: true; request: HumanPolishRequestRow }
  | { ok: false; status: number; error: string; code?: "draft_expired" }

export type AuthenticateDraftOptions = {
  /**
   * When true (default), extend draft_expires_at by the inactivity TTL after a
   * successful authentication. Never refreshes on failed / expired auth.
   */
  refreshExpiration?: boolean
}

/**
 * Extend draft_expires_at by the inactivity TTL. Server-authoritative only —
 * callers must never accept a client-supplied expiration timestamp.
 * Returns the new ISO expiry, or null if the update failed.
 */
export async function refreshDraftExpiration(
  supabase: SupabaseClient,
  requestId: string
): Promise<string | null> {
  const expiresAt = draftExpiresAt().toISOString()
  const { error } = await supabase
    .from("human_polish_requests")
    .update({ draft_expires_at: expiresAt })
    .eq("id", requestId)

  if (error) {
    console.error("[human-polish] draft expiration refresh failed")
    return null
  }
  return expiresAt
}

export async function authenticateDraftRequest(
  supabase: SupabaseClient,
  requestId: unknown,
  draftToken: unknown,
  options: AuthenticateDraftOptions = {}
): Promise<DraftAuthResult> {
  const refreshExpiration = options.refreshExpiration !== false

  if (typeof requestId !== "string" || !requestId.trim()) {
    return { ok: false, status: 400, error: "requestId is required." }
  }
  if (typeof draftToken !== "string" || !draftToken.trim()) {
    return { ok: false, status: 400, error: "draftToken is required." }
  }

  const { data, error } = await supabase
    .from("human_polish_requests")
    .select("*")
    .eq("id", requestId.trim())
    .maybeSingle()

  if (error) {
    console.error("[human-polish] draft lookup failed")
    return { ok: false, status: 500, error: "Failed to load draft request." }
  }
  if (!data) {
    return { ok: false, status: 404, error: "Draft request not found." }
  }

  const row = data as HumanPolishRequestRow

  if (!row.draft_token_hash || !row.draft_expires_at) {
    return { ok: false, status: 403, error: "Draft recovery is not available for this request." }
  }

  const expiresAt = Date.parse(row.draft_expires_at)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return {
      ok: false,
      status: 410,
      code: "draft_expired",
      error:
        "This draft has expired due to inactivity. Start a new intake to continue, or contact us if you need help recovering your request.",
    }
  }

  const providedHash = hashDraftToken(draftToken.trim())
  if (!hashesEqual(providedHash, row.draft_token_hash)) {
    return { ok: false, status: 403, error: "Invalid draft token." }
  }

  if (row.status !== "draft" && row.status !== "submitted") {
    // Allow uploads while still in early intake; block after payment lifecycle advances
    const blocked: HumanPolishStatus[] = [
      "paid",
      "files_accepted",
      "assigned",
      "in_progress",
      "first_batch_ready",
      "first_batch_delivered",
      "ready_for_review",
      "delivered",
      "revision_requested",
      "completed",
      "cancelled",
      "expired",
    ]
    if (blocked.includes(row.status)) {
      return { ok: false, status: 409, error: "This request no longer accepts draft uploads." }
    }
  }

  if (refreshExpiration) {
    const renewed = await refreshDraftExpiration(supabase, row.id)
    if (renewed) {
      row.draft_expires_at = renewed
    }
  }

  return { ok: true, request: row }
}
