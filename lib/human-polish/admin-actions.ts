"use server"

import { revalidatePath } from "next/cache"
import {
  AI_RENDER_PACK_RUSH_FEE_CENTS,
  AI_RENDER_PACK_RUSH_TARGETS,
  BUILD_READY_REVISION_ROUNDS,
  getDeliveryTarget,
  getFirstBatchSize,
  HUMAN_POLISH_SIGNED_URL_EXPIRES_IN,
  HUMAN_POLISH_UPLOAD_BUCKET,
} from "@/lib/human-polish/config"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import { isUuid, sanitizeSearchText } from "@/lib/human-polish/admin-utils"
import { humanPolishAbsoluteUrl, resolveHumanPolishAppUrl } from "@/lib/human-polish/app-url"
import {
  evaluateBuildReadyApproval,
  evaluateBuildReadyPaymentRequest,
  evaluateBuildReadyRevision,
} from "@/lib/human-polish/build-ready-guards"
import {
  sendBuildReadyPaymentRequestedEmail,
  sendBuildReadyQuoteEmail,
  sendBuildReadyScopeApprovedEmail,
  sendFilesAcceptedEmail,
  sendFilesNeedInfoEmail,
  sendFinalCompletionEmail,
  sendFinalDeliveryReadyEmail,
  sendFirstBatchReadyEmail,
  sendRevisionRequestReceivedEmail,
  sendRushApprovedEmail,
  sendRushUnavailableEmail,
  type HumanPolishEmailResult,
} from "@/lib/human-polish/email"
import {
  canMarkCompletedFromStatus,
  evaluateBriefMatchCorrection,
  evaluateRushApprove,
} from "@/lib/human-polish/ops-guards"
import {
  buildBuildReadyPaymentPath,
  buildReadyPaymentExpiresAt,
  generateBuildReadyPaymentToken,
  hashBuildReadyPaymentToken,
} from "@/lib/human-polish/payment-token"
import {
  buildReplacementUploadPath,
  generateReplacementUploadToken,
  hashReplacementUploadToken,
  replacementUploadExpiresAt,
} from "@/lib/human-polish/replacement-token"
import { getHumanPolishStripe } from "@/lib/human-polish/stripe"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  isAiRenderPackPackage,
  isHumanPolishPackage,
  isHumanPolishServiceFamily,
  isHumanPolishStatus,
  type HumanPolishStatus,
} from "@/lib/human-polish/types"
import { randomUUID } from "crypto"

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
  approved_package: string | null
  approved_amount: number | null
  rush_requested: boolean
  rush_approved: boolean
  assigned_to: string | null
  delivery_clock_started_at: string | null
  files_accepted_at: string | null
  first_batch_delivered_at: string | null
  final_delivered_at: string | null
  revision_count: number
  scope_reviewed_at: string | null
  scope_reviewed_by: string | null
  reviewer_message: string | null
  internal_review_notes: string | null
  payment_requested_at: string | null
  payment_request_id: string | null
  stripe_checkout_session_id: string | null
  currency: string
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

function revalidateAdmin(requestId: string) {
  revalidatePath("/admin/human-polish")
  revalidatePath(`/admin/human-polish/${requestId}`)
}

async function loadRequest(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  requestId: string
): Promise<{ ok: true; row: RequestRow } | { ok: false; error: string }> {
  if (!isUuid(requestId)) return { ok: false, error: "Invalid request id." }
  const { data, error } = await supabase
    .from("human_polish_requests")
    .select(
      "id, status, payment_status, updated_at, contact_name, contact_email, family, requested_package, approved_package, approved_amount, rush_requested, rush_approved, assigned_to, delivery_clock_started_at, files_accepted_at, first_batch_delivered_at, final_delivered_at, revision_count, scope_reviewed_at, scope_reviewed_by, reviewer_message, internal_review_notes, payment_requested_at, payment_request_id, stripe_checkout_session_id, currency"
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

  const isBuildReady = row.family === "build-ready"
  const isAi = row.family === "ai-render-pack"

  if (isAi) {
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
  } else if (isBuildReady) {
    if (row.payment_status === "paid") {
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
    } else {
      // Phase 7B: pre-payment Build-Ready scope review may request more files.
      if (!statusIn(row, ["submitted", "under_review", "needs_information"])) {
        return {
          ok: false,
          error: "Build-Ready file requests are not available in the current status.",
        }
      }
    }
  } else {
    return { ok: false, error: "Unknown service family." }
  }

  const message = sanitizeSearchText(input.message, 2000)
  if (!message) return { ok: false, error: "A message is required." }

  const items = sanitizeSearchText(input.requestedItems, 500)

  const rawToken = generateReplacementUploadToken()
  const tokenHash = hashReplacementUploadToken(rawToken)
  const issuedAt = new Date()
  const expiresAt = replacementUploadExpiresAt(issuedAt.getTime())

  let recoveryUrl: string
  try {
    const origin = resolveHumanPolishAppUrl()
    recoveryUrl = humanPolishAbsoluteUrl(
      origin,
      buildReplacementUploadPath(row.id, rawToken)
    )
  } catch {
    console.error("[human-polish/admin] replacement upload URL could not be built")
    return { ok: false, error: "Application URL is not configured for replacement uploads." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "needs_information",
    replacement_upload_token_hash: tokenHash,
    replacement_upload_expires_at: expiresAt.toISOString(),
    replacement_upload_issued_at: issuedAt.toISOString(),
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

  const mail = await sendFilesNeedInfoEmail({
    ...recipient(row),
    message,
    requestedItems: items
      ? items.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    recoveryUrl,
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
    replacement_upload_token_hash: null,
    replacement_upload_expires_at: null,
    replacement_upload_issued_at: null,
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

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

  const decision = evaluateRushApprove({
    paymentStatus: row.payment_status,
    requestedPackage: row.requested_package,
    rushRequested: row.rush_requested,
    rushApproved: row.rush_approved,
  })
  if (!decision.ok) return { ok: false, error: decision.error }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    rush_approved: true,
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

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

  revalidateAdmin(row.id)

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

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, patch)
  if (updated.ok) revalidateAdmin(row.id)
  return updated
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

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "in_progress",
  })
  if (updated.ok) revalidateAdmin(row.id)
  return updated
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
  if (row.family !== "ai-render-pack") {
    return { ok: false, error: "First-batch controls apply only to AI Render Packs." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "first_batch_ready",
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

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
  if (row.family !== "ai-render-pack") {
    return { ok: false, error: "First-batch controls apply only to AI Render Packs." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "first_batch_delivered",
    first_batch_delivered_at: new Date().toISOString(),
  })
  if (updated.ok) revalidateAdmin(row.id)
  return updated
}

export async function adminRecordBriefMatchCorrection(input: {
  requestId: string
  expectedUpdatedAt: string
  note: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }

  const decision = evaluateBriefMatchCorrection(
    {
      family: row.family,
      paymentStatus: row.payment_status,
      status: row.status,
      revisionCount: Number(row.revision_count ?? 0),
      note: input.note,
    },
    sanitizeSearchText
  )
  if (!decision.ok) return { ok: false, error: decision.error }

  const now = new Date().toISOString()
  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    revision_count: 1,
    last_revision_note: decision.sanitizedNote,
    last_revision_requested_at: now,
    status: "in_progress",
  })
  if (updated.ok) revalidateAdmin(row.id)
  return updated
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

  revalidateAdmin(row.id)

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

  if (!canMarkCompletedFromStatus(row.status)) {
    return { ok: false, error: "Complete only after final delivery (status delivered)." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    status: "completed",
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

  const mail = await sendFinalCompletionEmail({
    ...recipient(row),
    packageLabel: isHumanPolishPackage(row.requested_package)
      ? HUMAN_POLISH_PACKAGE_LABELS[row.requested_package]
      : row.requested_package,
  })

  return { ...updated, warning: emailWarning(mail) }
}

function clearBuildReadyPaymentFields(): Record<string, unknown> {
  return {
    build_ready_payment_token_hash: null,
    build_ready_payment_expires_at: null,
    build_ready_payment_issued_at: null,
    payment_requested_at: null,
    payment_request_id: null,
  }
}

export async function adminApproveBuildReadyScope(input: {
  requestId: string
  expectedUpdatedAt: string
  approvedPackage: string
  customAmountDollars?: string
  reviewerMessage?: string
  internalReviewNotes?: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }

  const hasOpenCheckoutSession =
    Boolean(row.stripe_checkout_session_id) &&
    (row.status === "awaiting_payment" || row.payment_status === "pending")

  const decision = evaluateBuildReadyApproval({
    family: row.family,
    paymentStatus: row.payment_status,
    status: row.status,
    approvedPackage: input.approvedPackage,
    customAmountDollars: input.customAmountDollars,
    reviewerMessage: input.reviewerMessage,
    internalReviewNotes: input.internalReviewNotes,
    hasOpenCheckoutSession,
    sanitize: sanitizeSearchText,
  })
  if (!decision.ok) return { ok: false, error: decision.error }

  const now = new Date().toISOString()
  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    approved_package: decision.approvedPackage,
    approved_amount: decision.approvedAmountCents,
    scope_reviewed_at: now,
    scope_reviewed_by: auth.user.id,
    reviewer_message: decision.sanitizedReviewerMessage,
    internal_review_notes: decision.sanitizedInternalNotes,
    status: "ready_for_payment",
    manual_quote_required: decision.approvedPackage === "custom",
    ...clearBuildReadyPaymentFields(),
    stripe_checkout_session_id: null,
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

  let warning: string | undefined
  try {
    if (decision.approvedPackage === "custom") {
      const mail = await sendBuildReadyQuoteEmail({
        ...recipient(row),
        quotedAmountCents: decision.approvedAmountCents,
        currency: row.currency || "usd",
        message: decision.sanitizedReviewerMessage || undefined,
      })
      warning = emailWarning(mail)
    } else if (isHumanPolishPackage(decision.approvedPackage)) {
      const mail = await sendBuildReadyScopeApprovedEmail({
        ...recipient(row),
        packageLabel: HUMAN_POLISH_PACKAGE_LABELS[decision.approvedPackage],
        deliveryTarget:
          getDeliveryTarget("build-ready", decision.approvedPackage) || undefined,
        revisionRounds:
          decision.approvedPackage === "essentials-2d" ||
          decision.approvedPackage === "essentials-3d"
            ? BUILD_READY_REVISION_ROUNDS[decision.approvedPackage]
            : undefined,
      })
      warning = emailWarning(mail)
    }
  } catch {
    warning = "Request updated, but the customer email could not be sent."
  }

  return { ...updated, warning }
}

export async function adminSendBuildReadyPaymentRequest(input: {
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

  const decision = evaluateBuildReadyPaymentRequest({
    family: row.family,
    paymentStatus: row.payment_status,
    status: row.status,
    approvedPackage: row.approved_package,
    approvedAmount: row.approved_amount,
    scopeReviewedAt: row.scope_reviewed_at,
  })
  if (!decision.ok) return { ok: false, error: decision.error }

  const rawToken = generateBuildReadyPaymentToken()
  const tokenHash = hashBuildReadyPaymentToken(rawToken)
  const issuedAt = new Date()
  const expiresAt = buildReadyPaymentExpiresAt(issuedAt.getTime())
  const paymentRequestId = randomUUID()

  let paymentUrl: string
  try {
    const origin = resolveHumanPolishAppUrl()
    paymentUrl = humanPolishAbsoluteUrl(
      origin,
      buildBuildReadyPaymentPath(row.id, rawToken)
    )
  } catch {
    console.error("[human-polish/admin] build-ready payment URL could not be built")
    return { ok: false, error: "Application URL is not configured for payment requests." }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    build_ready_payment_token_hash: tokenHash,
    build_ready_payment_expires_at: expiresAt.toISOString(),
    build_ready_payment_issued_at: issuedAt.toISOString(),
    payment_requested_at: issuedAt.toISOString(),
    payment_request_id: paymentRequestId,
    status: "ready_for_payment",
    stripe_checkout_session_id: null,
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

  const pkg = row.approved_package
  const mail = await sendBuildReadyPaymentRequestedEmail({
    ...recipient(row),
    packageLabel:
      pkg && isHumanPolishPackage(pkg) ? HUMAN_POLISH_PACKAGE_LABELS[pkg] : pkg || "Build-Ready",
    amountCents: row.approved_amount || undefined,
    currency: row.currency || "usd",
    paymentUrl,
  })

  return { ...updated, warning: emailWarning(mail) }
}

export async function adminRevokeBuildReadyPaymentRequest(input: {
  requestId: string
  expectedUpdatedAt: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  if (row.family !== "build-ready") {
    return { ok: false, error: "Payment request revoke applies only to Build-Ready." }
  }
  if (row.payment_status === "paid") {
    return { ok: false, error: "Paid requests cannot revoke a payment request." }
  }

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }

  if (row.stripe_checkout_session_id) {
    const stripe = getHumanPolishStripe()
    if (!stripe) {
      return {
        ok: false,
        error: "Stripe is not configured; cannot expire the open Checkout Session.",
      }
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(row.stripe_checkout_session_id)
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(row.stripe_checkout_session_id)
      }
    } catch (err) {
      console.error(
        "[human-polish/admin] failed to expire Build-Ready Checkout Session",
        err instanceof Error ? err.message : "unknown"
      )
      return {
        ok: false,
        error: "Could not expire the open Checkout Session. Try again before revoking.",
      }
    }
  }

  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    ...clearBuildReadyPaymentFields(),
    stripe_checkout_session_id: null,
    payment_status: "unpaid",
    status: "under_review",
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)
  return updated
}

export async function adminRecordBuildReadyRevisionRequest(input: {
  requestId: string
  expectedUpdatedAt: string
  note: string
}): Promise<AdminActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const loaded = await loadRequest(auth.supabase, input.requestId)
  if (!loaded.ok) return loaded
  const row = loaded.row

  const terminal = assertNotTerminal(row)
  if (terminal) return { ok: false, error: terminal }

  const decision = evaluateBuildReadyRevision({
    family: row.family,
    paymentStatus: row.payment_status,
    status: row.status,
    approvedPackage: row.approved_package,
    revisionCount: Number(row.revision_count ?? 0),
    note: input.note,
    sanitize: sanitizeSearchText,
  })
  if (!decision.ok) return { ok: false, error: decision.error }

  const now = new Date().toISOString()
  const updated = await updateRequest(auth.supabase, row.id, input.expectedUpdatedAt, {
    revision_count: decision.nextCount,
    last_revision_note: decision.sanitizedNote,
    last_revision_requested_at: now,
    status: "in_progress",
  })
  if (!updated.ok) return updated

  revalidateAdmin(row.id)

  const mail = await sendRevisionRequestReceivedEmail({
    ...recipient(row),
    revisionNumber: decision.nextCount,
    message: decision.sanitizedNote,
  })

  return { ...updated, warning: emailWarning(mail) }
}
