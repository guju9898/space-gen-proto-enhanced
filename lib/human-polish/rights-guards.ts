/**
 * Pure guards for portfolio rights permission (Phase 8B).
 * No I/O — callers supply hashed token + row snapshots.
 */

export const HUMAN_POLISH_RIGHTS_PERMISSION_STATUSES = [
  "not_requested",
  "requested",
  "granted",
  "declined",
] as const

export type HumanPolishRightsPermissionStatus =
  (typeof HUMAN_POLISH_RIGHTS_PERMISSION_STATUSES)[number]

export function isHumanPolishRightsPermissionStatus(
  value: unknown
): value is HumanPolishRightsPermissionStatus {
  return (
    typeof value === "string" &&
    (HUMAN_POLISH_RIGHTS_PERMISSION_STATUSES as readonly string[]).includes(value)
  )
}

export const RIGHTS_PERMISSION_STATUS_LABELS: Record<
  HumanPolishRightsPermissionStatus,
  string
> = {
  not_requested: "Not requested",
  requested: "Requested",
  granted: "Granted",
  declined: "Declined",
}

export type RightsAccessRow = {
  id: string
  payment_status: string
  status: string
  rights_permission_status: string
  rights_permission_token_hash: string | null
  rights_permission_expires_at: string | null
}

export type RightsAccessDecision =
  | { ok: true }
  | { ok: false; status: number; error: string; code?: "rights_expired" }

/**
 * Token unlocks rights Allow/Decline only. Uniform deny copy is applied by callers.
 */
export function evaluateRightsPermissionAccess(input: {
  row: RightsAccessRow | null
  providedHash: string
  hashesEqual: (a: string, b: string) => boolean
  nowMs?: number
}): RightsAccessDecision {
  const { row, providedHash, hashesEqual } = input
  const nowMs = input.nowMs ?? Date.now()

  if (!row) {
    return { ok: false, status: 404, error: "Rights permission link is invalid or has expired." }
  }
  if (row.payment_status !== "paid") {
    return { ok: false, status: 404, error: "Rights permission link is invalid or has expired." }
  }
  if (row.status !== "completed") {
    return { ok: false, status: 404, error: "Rights permission link is invalid or has expired." }
  }
  if (row.rights_permission_status !== "requested") {
    return { ok: false, status: 404, error: "Rights permission link is invalid or has expired." }
  }
  if (!row.rights_permission_token_hash || !row.rights_permission_expires_at) {
    return { ok: false, status: 404, error: "Rights permission link is invalid or has expired." }
  }
  const expiresAt = Date.parse(row.rights_permission_expires_at)
  if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
    return {
      ok: false,
      status: 410,
      error: "Rights permission link is invalid or has expired.",
      code: "rights_expired",
    }
  }
  if (!hashesEqual(providedHash, row.rights_permission_token_hash)) {
    return { ok: false, status: 404, error: "Rights permission link is invalid or has expired." }
  }
  return { ok: true }
}

export type RightsIssueDecision =
  | { ok: true; mode: "issue" | "reissue" }
  | { ok: false; error: string }

/** Admin may issue/reissue only before a final granted/declined decision. */
export function evaluateRightsPermissionIssue(input: {
  paymentStatus: string
  status: string
  rightsPermissionStatus: string
  rightsPermissionExpiresAt: string | null
  nowMs?: number
}): RightsIssueDecision {
  const nowMs = input.nowMs ?? Date.now()
  if (input.paymentStatus !== "paid") {
    return { ok: false, error: "Rights permission requires a paid request." }
  }
  if (input.status !== "completed") {
    return { ok: false, error: "Rights permission can only be requested after completion." }
  }
  if (
    input.rightsPermissionStatus === "granted" ||
    input.rightsPermissionStatus === "declined"
  ) {
    return {
      ok: false,
      error: "A final portfolio permission decision already exists for this request.",
    }
  }
  if (input.rightsPermissionStatus === "not_requested") {
    return { ok: true, mode: "issue" }
  }
  if (input.rightsPermissionStatus === "requested") {
    const expiresAt = input.rightsPermissionExpiresAt
      ? Date.parse(input.rightsPermissionExpiresAt)
      : NaN
    if (Number.isFinite(expiresAt) && expiresAt > nowMs) {
      return {
        ok: false,
        error: "A portfolio permission request is already active. Wait for expiry to reissue.",
      }
    }
    return { ok: true, mode: "reissue" }
  }
  return { ok: false, error: "Rights permission cannot be requested in the current state." }
}

export type RightsDecisionKind = "allow" | "decline"

export type RightsDecisionResult =
  | {
      ok: true
      nextStatus: "granted" | "declined"
      rightsPermissionGranted: boolean
    }
  | { ok: false; error: string }

/** Pure decision after access has already been validated. */
export function evaluateRightsPermissionDecision(
  kind: RightsDecisionKind
): RightsDecisionResult {
  if (kind === "allow") {
    return { ok: true, nextStatus: "granted", rightsPermissionGranted: true }
  }
  if (kind === "decline") {
    return { ok: true, nextStatus: "declined", rightsPermissionGranted: false }
  }
  return { ok: false, error: "Invalid rights decision." }
}
