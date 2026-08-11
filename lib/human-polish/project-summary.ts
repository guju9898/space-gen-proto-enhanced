/**
 * Deterministic Admin-only project summary for clipboard copy (Phase 8B).
 * No tokens, Stripe IDs, storage paths, or contact PII.
 */

import {
  familyLabel,
  formatAdminDate,
  packageLabel,
  paymentStatusLabel,
  statusLabel,
} from "@/lib/human-polish/admin-utils"
import { formatAmountFromCents } from "@/lib/human-polish/email"
import { getDeliveryTarget } from "@/lib/human-polish/config"
import {
  isHumanPolishPackage,
  isHumanPolishServiceFamily,
} from "@/lib/human-polish/types"

export type ProjectSummaryInput = {
  id: string
  family: string
  requested_package: string
  approved_package: string | null
  approved_amount: number | null
  currency: string
  project_type: string | null
  project_city: string | null
  project_state: string | null
  status: string
  payment_status: string
  rush_requested: boolean
  rush_approved: boolean
  assigned_to: string | null
  revision_count: number
  last_revision_note: string | null
  brief_text: string | null
  design_objectives: string | null
  must_have_elements: string | null
  fileCount: number
}

function line(label: string, value: string | null | undefined): string | null {
  const v = (value || "").trim()
  if (!v) return null
  return `${label}: ${v}`
}

export function buildHumanPolishProjectSummary(row: ProjectSummaryInput): string {
  const family = isHumanPolishServiceFamily(row.family) ? row.family : null
  const pkg = isHumanPolishPackage(row.requested_package) ? row.requested_package : null
  const approved = row.approved_package && isHumanPolishPackage(row.approved_package)
    ? row.approved_package
    : null

  const delivery =
    family && (approved || pkg)
      ? getDeliveryTarget(family, approved || pkg!)
      : null

  const amount =
    typeof row.approved_amount === "number"
      ? formatAmountFromCents(row.approved_amount, row.currency || "usd")
      : null

  const location = [row.project_city, row.project_state].filter(Boolean).join(", ")

  const lines = [
    "Human Polish — Project Summary",
    "--------------------------------",
    line("Request reference", row.id),
    line("Service family", family ? familyLabel(family) : row.family),
    line("Requested package", packageLabel(row.requested_package)),
    line("Approved package", approved ? packageLabel(approved) : row.approved_package),
    line("Approved amount", amount),
    line("Project type", row.project_type?.replace(/_/g, " ") || null),
    line("Location (city/state)", location || null),
    line("Status", statusLabel(row.status)),
    line("Payment status", paymentStatusLabel(row.payment_status)),
    line("Delivery target", delivery),
    line("Rush requested", row.rush_requested ? "Yes" : "No"),
    line("Rush approved", row.rush_approved ? "Yes" : "No"),
    line("Assignee", row.assigned_to),
    line("Revision count", String(row.revision_count ?? 0)),
    line("Latest revision note", row.last_revision_note),
    line("Uploaded file count", String(row.fileCount ?? 0)),
    line("Brief", row.brief_text),
    line("Design objectives", row.design_objectives),
    line("Must-have elements", row.must_have_elements),
    line("Copied at", formatAdminDate(new Date().toISOString())),
  ].filter(Boolean) as string[]

  return lines.join("\n")
}
