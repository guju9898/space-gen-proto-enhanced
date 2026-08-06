/**
 * Shared admin helpers (safe for server components; no service-role secrets).
 */

import {
  HUMAN_POLISH_PACKAGE_LABELS,
  HUMAN_POLISH_PAYMENT_STATUSES,
  HUMAN_POLISH_SERVICE_FAMILIES,
  HUMAN_POLISH_SERVICE_FAMILY_LABELS,
  HUMAN_POLISH_STATUSES,
  isHumanPolishPackage,
  isHumanPolishServiceFamily,
  isHumanPolishStatus,
  type HumanPolishPackage,
  type HumanPolishPaymentStatus,
  type HumanPolishServiceFamily,
  type HumanPolishStatus,
} from "@/lib/human-polish/types"

function isHumanPolishPaymentStatus(value: unknown): value is HumanPolishPaymentStatus {
  return (
    typeof value === "string" &&
    (HUMAN_POLISH_PAYMENT_STATUSES as readonly string[]).includes(value)
  )
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): boolean {
  return typeof value === "string" && UUID_RE.test(value)
}

export function shortRequestId(id: string): string {
  return id.slice(0, 8)
}

export function packageLabel(pkg: string | null | undefined): string {
  if (!pkg || !isHumanPolishPackage(pkg)) return pkg || "—"
  return HUMAN_POLISH_PACKAGE_LABELS[pkg]
}

export function familyLabel(family: string | null | undefined): string {
  if (!family || !isHumanPolishServiceFamily(family)) return family || "—"
  return HUMAN_POLISH_SERVICE_FAMILY_LABELS[family]
}

export function statusLabel(status: string | null | undefined): string {
  if (!status || !isHumanPolishStatus(status)) return status || "—"
  return status.replace(/_/g, " ")
}

export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status || !isHumanPolishPaymentStatus(status)) return status || "—"
  return status
}

export function deliveryClockLabel(
  deliveryClockStartedAt: string | null | undefined
): string {
  return deliveryClockStartedAt ? "Started" : "Not started"
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function sanitizeSearchText(raw: string | undefined | null, max = 120): string {
  if (typeof raw !== "string") return ""
  return raw.trim().slice(0, max)
}

export function parseStatusParam(raw: string | undefined | null): HumanPolishStatus | null {
  if (!raw || !isHumanPolishStatus(raw)) return null
  return raw
}

export function parseFamilyParam(
  raw: string | undefined | null
): HumanPolishServiceFamily | null {
  if (!raw || !isHumanPolishServiceFamily(raw)) return null
  return raw
}

export function parsePackageParam(raw: string | undefined | null): HumanPolishPackage | null {
  if (!raw || !isHumanPolishPackage(raw)) return null
  return raw
}

export function parsePaymentStatusParam(
  raw: string | undefined | null
): HumanPolishPaymentStatus | null {
  if (!raw || !isHumanPolishPaymentStatus(raw)) return null
  return raw
}

export function parseRushFilter(
  raw: string | undefined | null
): "requested" | "approved" | "none" | null {
  if (raw === "requested" || raw === "approved" || raw === "none") return raw
  return null
}

export const ADMIN_LIST_PAGE_SIZE = 25

export {
  HUMAN_POLISH_STATUSES,
  HUMAN_POLISH_SERVICE_FAMILIES,
  HUMAN_POLISH_PAYMENT_STATUSES,
}
