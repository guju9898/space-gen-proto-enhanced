"use server"

import {
  AI_RENDER_PACK_RUSH_FEE_CENTS,
  AI_RENDER_PACK_RUSH_TARGETS,
  getDeliveryTarget,
  getFirstBatchSize,
  HUMAN_POLISH_SIGNED_URL_EXPIRES_IN,
  HUMAN_POLISH_UPLOAD_BUCKET,
} from "@/lib/human-polish/config"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import { isUuid, sanitizeSearchText } from "@/lib/human-polish/admin-utils"
import {
  sendFilesAcceptedEmail,
  sendFilesNeedInfoEmail,
  sendFinalCompletionEmail,
  sendFinalDeliveryReadyEmail,
  sendFirstBatchReadyEmail,
  sendRushApprovedEmail,
  sendRushUnavailableEmail,
  type HumanPolishEmailResult,
} from "@/lib/human-polish/email"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  isAiRenderPackPackage,
  isHumanPolishPackage,
  isHumanPolishServiceFamily,
  isHumanPolishStatus,
  type HumanPolishStatus,
} from "@/lib/human-polish/types"

export type AdminActionResult = {
  ok: boolean
  error?: string
  warning?: string
  newStatus?: string
}

type RequestRow = {
  id: string
  status: string
  payment_status: string
  updated_at: string
  contact_name: string | null
  contact_email: string | null
  family: string
  requested_package: string
  rush_requested: boolean
  rush_approved: boolean
  assigned_to: string | null
  delivery_clock_started_at: string | null
  files_accepted_at: string | null
  first_batch_delivered_at: string | null
  final_delivered_at: string | null
}

function emailWarning(result: HumanPolishEmailResult | null): string | undefined {
  if (!result) return undefined
  if (result.sent || result.skipped) return undefined
  return "Request updated, but the customer email could not be sent."
}

function recipient(row: RequestRow) {
  return {
    to: row.contact_email || "",
    contactName: row.contact_name || undefined,
    requestId: row.id,
  }
}

async function loadRequest(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  requestId: string
): Promise<{ ok: true; row: RequestRow } | { ok: false; error: string }> {
  if (!isUuid(requestId)) return { ok: false, error: "Invalid request id." }
  const { data, error } = await supabase
    .from("human_polish_requests")
    .select(
      "id, status, payment_status, updated_at, contact_name, contact_email, family, requested_package, rush_requested, rush_approved, assigned_to, delivery_clock_started_at, files_accepted_at, first_batch_delivered_at, final_delivered_at"
    )
    .eq("id", requestId)
    .maybeSingle()

  if (error) {
    console.error("[human-polish/admin] load request failed", error.code || "db_error")
    return { ok: false, error: "Unable to load request." }
  }
  if (!data) return { ok: false, error: "Request not found." }
  return { ok: true, row: data as unknown as RequestRow }
}

function assertNotTerminal(row: RequestRow): string | null {
  if (row.status === "cancelled") return "Cancelled requests cannot be updated."
  if (row.status === "completed") return "Completed requests cannot move backward."
  if (row.status === "expired") return "Expired requests cannot be updated."
  return null
}

function assertPaidForProduction(row: RequestRow): string | null {
  if (row.payment_status !== "paid") {
    return "Payment must be complete before this production action."
  }
  return null
}

function statusIn(row: RequestRow, allowed: HumanPolishStatus[]): boolean {
  return isHumanPolishStatus(row.status) && allowed.includes(row.status)
}

async function updateRequest(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  requestId: string,
  expectedUpdatedAt: string,
  patch: Record<string, unknown>
): Promise<AdminActionResult> {
  const { data, error } = await supabase
    .from("human_polish_requests")
    .update(patch)
    .eq("id", requestId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id, status")
    .maybeSingle()

  if (error) {
    console.error("[human-polish/admin] update failed", error.code || "db_error")
    return { ok: false, error: "Unable to update request." }
  }
  if (!data) {
    return {
      ok: false,
      error: "This request changed since you loaded it. Refresh and try again.",
    }
  }
  return { ok: true, newStatus: (data as { status?: string }).status }
}

export async function createAdminFileSignedUrl(input: {
  requestId: string
  fileId: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  if (!isUuid(input.requestId) || !isUuid(input.fileId)) {
    return { ok: false, error: "Invalid file reference." }
  }

  const { data: file, error } = await auth.supabase
    .from("human_polish_files")
    .select("id, request_id, bucket_name, object_path")
    .eq("id", input.fileId)
    .eq("request_id", input.requestId)
    .maybeSingle()

  if (error) {
    console.error("[human-polish/admin] file lookup failed", error.code || "db_error")
    return { ok: false, error: "Unable to open file." }
  }
  if (!file) return { ok: false, error: "File not found for this request." }

  const row = file as {
    bucket_name: string
    object_path: string
  }

  const bucket = row.bucket_name || HUMAN_POLISH_UPLOAD_BUCKET
  const { data: signed, error: signError } = await auth.supabase.storage
    .from(bucket)
    .createSignedUrl(row.object_path, HUMAN_POLISH_SIGNED_URL_EXPIRES_IN)

  if (signError || !signed?.signedUrl) {
    console.error("[human-polish/admin] signed url failed")
    return { ok: false, error: "Unable to create a temporary file link." }
  }

  return { ok: true, url: signed.signedUrl }
}

export async function adminRequestFilesNeedInfo(input: {
  requestId: string
  expectedUpdatedAt: string
  message: string
  requestedItems?: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (
    !statusIn(row, [
      "paid",
      "needs_information",
      "files_accepted",
      "assigned",
      "in_progress",
    ])
  ) {
    return { ok: false, error: "Files cannot be requested in the current status." }
  }

  const message = sanitizeSearchText(input.message, 2000)
  if (!message) return { ok: false, error: "A message is required." }

  const items = sanitizeSearchText(input.requestedItems, 500)
  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "needs_information",
  })
  if (!updated.ok) return updated

  const mail = await sendFilesNeedInfoEmail({
    ...recipient(row),
    message,
    requestedItems: items
      ? items.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
  })

  return { ...updated, warning: emailWarning(mail) }
}

export async function adminAcceptFiles(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (!statusIn(row, ["paid", "needs_information"])) {
    return { ok: false, error: "Files can only be accepted from paid or needs-information." }
  }

  const now = new Date().toISOString()
  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "files_accepted",
    files_accepted_at: now,
    delivery_clock_started_at: row.delivery_clock_started_at || now,
  })
  if (!updated.ok) return updated

  if (
    !isHumanPolishServiceFamily(row.family) ||
    !isHumanPolishPackage(row.requested_package)
  ) {
    return updated
  }

  const mail = await sendFilesAcceptedEmail({
    ...recipient(row),
    family: row.family,
    packageLabel: HUMAN_POLISH_PACKAGE_LABELS[row.requested_package],
    deliveryTarget: getDeliveryTarget(row.family, row.requested_package) || undefined,
    firstBatchSize: isAiRenderPackPackage(row.requested_package)
      ? getFirstBatchSize(row.requested_package)
      : undefined,
  })

  return { ...updated, warning: emailWarning(mail) }
}

export async function adminApproveRush(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  if (!row.rush_requested) return { ok: false, error: "Rush was not requested." }
  if (row.rush_approved) return { ok: false, error: "Rush is already approved." }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    rush_approved: true,
  })
  if (!updated.ok) return updated

  const rushTarget =
    isAiRenderPackPackage(row.requested_package)
      ? AI_RENDER_PACK_RUSH_TARGETS[row.requested_package]
      : undefined

  const mail = await sendRushApprovedEmail({
    ...recipient(row),
    rushTarget: rushTarget || "Approved rush timing will be confirmed by the team.",
    rushFeeCents: AI_RENDER_PACK_RUSH_FEE_CENTS,
  })

  return { ...updated, warning: emailWarning(mail) }
}

export async function adminRejectRush(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  if (!row.rush_requested) return { ok: false, error: "Rush was not requested." }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    rush_approved: false,
  })
  if (!updated.ok) return updated

  const standard =
    isHumanPolishServiceFamily(row.family) && isHumanPolishPackage(row.requested_package)
      ? getDeliveryTarget(row.family, row.requested_package) || undefined
      : undefined

  const mail = await sendRushUnavailableEmail({
    ...recipient(row),
    standardDeliveryTarget: standard || "Standard delivery timing applies.",
  })

  return { ...updated, warning: emailWarning(mail) }
}

export async function adminAssignTeamMember(input: {
  requestId: string
  expectedUpdatedAt: string
  assignedTo: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (
    !statusIn(row, [
      "files_accepted",
      "assigned",
      "in_progress",
      "first_batch_ready",
      "first_batch_delivered",
    ])
  ) {
    return { ok: false, error: "Assign after files are accepted." }
  }

  const assignedTo = sanitizeSearchText(input.assignedTo, 120)
  if (!assignedTo) return { ok: false, error: "Assignee is required." }

  const patch: Record<string, unknown> = { assigned_to: assignedTo }
  if (row.status === "files_accepted") patch.status = "assigned"

  return updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, patch)
}

export async function adminStartProduction(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (!statusIn(row, ["files_accepted", "assigned"])) {
    return { ok: false, error: "Production can start from files_accepted or assigned." }
  }

  return updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "in_progress",
  })
}

export async function adminMarkFirstBatchReady(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (!statusIn(row, ["in_progress"])) {
    return { ok: false, error: "First batch ready requires in_progress." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "first_batch_ready",
  })
  if (!updated.ok) return updated

  const mail = await sendFirstBatchReadyEmail({
    ...recipient(row),
    firstBatchSize: isAiRenderPackPackage(row.requested_package)
      ? getFirstBatchSize(row.requested_package)
      : 0,
  })

  return { ...updated, warning: emailWarning(mail) }
}

export async function adminRecordFirstBatchDelivery(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (!statusIn(row, ["first_batch_ready"])) {
    return { ok: false, error: "Record first-batch delivery from first_batch_ready." }
  }

  return updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "first_batch_delivered",
    first_batch_delivered_at: new Date().toISOString(),
  })
}

export async function adminRecordFinalDelivery(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }
  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (
    !statusIn(row, [
      "first_batch_delivered",
      "in_progress",
      "ready_for_review",
      "first_batch_ready",
    ])
  ) {
    return { ok: false, error: "Final delivery is not available in the current status." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "delivered",
    final_delivered_at: new Date().toISOString(),
  })
  if (!updated.ok) return updated

  const mail = await sendFinalDeliveryReadyEmail({
    ...recipient(row),
    packageLabel: isHumanPolishPackage(row.requested_package)
      ? HUMAN_POLISH_PACKAGE_LABELS[row.requested_package]
      : row.requested_package,
  })

  return { ...updated, warning: emailWarning(mail) }
}

export async function adminMarkCompleted(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  if (row.status === "cancelled" || row.status === "expired") {
    return { ok: false, error: "This request cannot be completed." }
  }
  if (row.status === "completed") return { ok: false, error: "Already completed." }

  const paid = assertPaidForProduction(row)
  if (paid) return { ok: false, error: paid }

  if (!statusIn(row, ["delivered", "first_batch_delivered"])) {
    return { ok: false, error: "Complete only after delivery." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "completed",
  })
  if (!updated.ok) return updated

  const mail = await sendFinalCompletionEmail({
    ...recipient(row),
    packageLabel: isHumanPolishPackage(row.requested_package)
      ? HUMAN_POLISH_PACKAGE_LABELS[row.requested_package]
      : row.requested_package,
  })

  return { ...updated, warning: emailWarning(mail) }
}
