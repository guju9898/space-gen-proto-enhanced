/**
 * Pure helpers for AI Render Pack paid_at / pack_expires_at and reminder eligibility.
 */

import {
  AI_RENDER_PACK_EXPIRATION_DAYS,
  HUMAN_POLISH_PACK_EXPIRATION_REMINDER_DAYS,
} from "./config"

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function computeAiPackExpiresAt(paidAtMs: number): Date {
  return new Date(paidAtMs + AI_RENDER_PACK_EXPIRATION_DAYS * MS_PER_DAY)
}

/**
 * Fields to set on the first successful paid transition.
 * Does not overwrite existing paid_at / pack_expires_at.
 */
export function buildFirstPaidTransitionFields(input: {
  family: string
  existingPaidAt: string | null | undefined
  existingPackExpiresAt: string | null | undefined
  paidAtMs?: number
}): Record<string, string> {
  const paidAtMs = input.paidAtMs ?? Date.now()
  const patch: Record<string, string> = {}

  if (!input.existingPaidAt) {
    patch.paid_at = new Date(paidAtMs).toISOString()
  }

  const paidAtIso = patch.paid_at || input.existingPaidAt || null
  if (
    input.family === "ai-render-pack" &&
    !input.existingPackExpiresAt &&
    paidAtIso
  ) {
    const anchorMs = Date.parse(paidAtIso)
    if (Number.isFinite(anchorMs)) {
      patch.pack_expires_at = computeAiPackExpiresAt(anchorMs).toISOString()
    }
  }

  return patch
}

/** Statuses that should not receive pack-expiration reminders. */
export const PACK_EXPIRATION_REMINDER_SKIP_STATUSES = new Set([
  "completed",
  "expired",
  "delivered",
  "cancelled",
])

export type PackExpirationReminderRow = {
  id: string
  family: string
  payment_status: string
  status: string
  pack_expires_at: string | null
  expiration_reminder_sent_at: string | null
}

export function isPackExpirationReminderEligible(
  row: PackExpirationReminderRow,
  nowMs: number = Date.now()
): boolean {
  if (row.family !== "ai-render-pack") return false
  if (row.payment_status !== "paid") return false
  if (!row.pack_expires_at) return false
  if (row.expiration_reminder_sent_at) return false
  if (PACK_EXPIRATION_REMINDER_SKIP_STATUSES.has(row.status)) return false

  const expiresAt = Date.parse(row.pack_expires_at)
  if (!Number.isFinite(expiresAt)) return false
  if (expiresAt <= nowMs) return false

  const windowMs = HUMAN_POLISH_PACK_EXPIRATION_REMINDER_DAYS * MS_PER_DAY
  return expiresAt <= nowMs + windowMs
}

/** Whole days remaining until pack_expires_at (ceil), minimum 0. */
export function daysRemainingUntilPackExpiry(
  packExpiresAtIso: string,
  nowMs: number = Date.now()
): number {
  const expiresAt = Date.parse(packExpiresAtIso)
  if (!Number.isFinite(expiresAt)) return 0
  const delta = expiresAt - nowMs
  if (delta <= 0) return 0
  return Math.ceil(delta / MS_PER_DAY)
}

export function formatPackExpiresOnDisplay(packExpiresAtIso: string): string {
  const ms = Date.parse(packExpiresAtIso)
  if (!Number.isFinite(ms)) return packExpiresAtIso
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(ms))
}
