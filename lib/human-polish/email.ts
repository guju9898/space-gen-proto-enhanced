/**
 * Human Polish™ V1 — transactional email module (Loops).
 * Source of truth: docs/human-polish-v1-spec.md (§3.1, §6.2, §13 Email Agent).
 *
 * Exposes one typed function per §6.2 milestone plus an internal-alert helper.
 * Design rules (enforced here):
 *   - Functions take TYPED params, never raw request bodies.
 *   - Sends go through the Loops transactional API, mirroring the fetch/auth
 *     conventions of the existing integration in `lib/loops.ts` (which is NOT
 *     modified). We do not add npm packages.
 *   - Email failures MUST NOT throw into the caller's critical path (payment/
 *     order state). Every send is wrapped; functions resolve to a result object.
 *   - Safe no-op when `LOOPS_API_KEY` is absent (local/build/test) or when the
 *     transactional template id has not been provisioned yet (TODO placeholder).
 *   - Never log PII beyond what is strictly necessary, and never log API keys.
 *
 * Intended call sites (integration is wired by OTHER agents; do NOT wire here):
 *   - sendDraftReceivedEmail          → intake draft-create API (draft/recovery)
 *   - sendPaymentReceivedEmail        → Stripe webhook, guarded human_polish branch
 *   - sendFilesNeedInfoEmail          → admin dashboard (request more/replacement files)
 *   - sendFilesAcceptedEmail          → admin dashboard (mark files usable / start clock)
 *   - sendRushApprovedEmail           → admin dashboard (approve rush)
 *   - sendRushUnavailableEmail        → admin dashboard (reject rush → standard)
 *   - sendFirstBatchReadyEmail        → admin dashboard (record first-batch delivery)
 *   - sendFinalDeliveryReadyEmail     → admin dashboard (record final delivery)
 *   - sendBuildReadyScopeApprovedEmail→ admin dashboard (Build-Ready scope approval)
 *   - sendBuildReadyQuoteEmail        → admin dashboard (custom quote / more info)
 *   - sendBuildReadyPaymentRequestedEmail → admin dashboard (send payment request)
 *   - sendRevisionRequestReceivedEmail→ revision-request intake/admin
 *   - sendFinalCompletionEmail        → admin dashboard (mark completed)
 *   - sendRightsPermissionRequestEmail→ delivery/rights flywheel
 *   - sendPackExpirationReminderEmail → scheduled job (90-day expiration reminder)
 *   - sendInternalTeamAlertEmail      → any of the above server flows (frank@…)
 */

import {
  AI_RENDER_PACK_EXPIRATION_DAYS,
  HUMAN_POLISH_CURRENCY,
  HUMAN_POLISH_DRAFT_TTL_MINUTES,
} from "./config"
import type { HumanPolishServiceFamily } from "./types"
import { HUMAN_POLISH_SERVICE_FAMILY_LABELS } from "./types"
import {
  getInternalAlertEmail,
  HUMAN_POLISH_EVENT_NAMES,
  isProvisionedTransactionalId,
  resolveTransactionalId,
  type HumanPolishEmailKey,
} from "./email-templates"

// ---------------------------------------------------------------------------
// Loops transactional transport (mirrors lib/loops.ts conventions).
// ---------------------------------------------------------------------------

const LOOPS_API_KEY = process.env.LOOPS_API_KEY
const LOOPS_API_BASE_URL = process.env.LOOPS_API_BASE_URL || "https://app.loops.so/api/v1"

/** Values Loops accepts inside `dataVariables`. */
type DataVariableValue = string | number | boolean

/** Result of an email attempt. Functions NEVER throw; they resolve to this. */
export type HumanPolishEmailResult = {
  /** True only when Loops accepted the transactional request. */
  sent: boolean
  /** True when we intentionally skipped (disabled / not provisioned). */
  skipped: boolean
  /** Machine-readable reason for a non-send. */
  reason?:
    | "loops_disabled"
    | "template_not_provisioned"
    | "invalid_recipient"
    | "http_error"
    | "exception"
  /** The milestone key, for logging/telemetry by the caller. */
  key: HumanPolishEmailKey
}

function isLikelyEmail(value: string | undefined | null): value is string {
  return typeof value === "string" && /.+@.+\..+/.test(value.trim())
}

/** Drop undefined/null so Loops never receives empty variables. */
function compactVariables(
  vars: Record<string, DataVariableValue | undefined | null>
): Record<string, DataVariableValue> {
  const out: Record<string, DataVariableValue> = {}
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v
  }
  return out
}

/**
 * Send a single Human Polish transactional email. Guarded, never throws.
 * Not exported: callers use the typed per-milestone functions below.
 */
async function dispatchTransactional(
  key: HumanPolishEmailKey,
  email: string,
  dataVariables: Record<string, DataVariableValue>
): Promise<HumanPolishEmailResult> {
  // Guard: safe no-op when Loops is not configured (local dev / build / test).
  if (!LOOPS_API_KEY) {
    return { sent: false, skipped: true, reason: "loops_disabled", key }
  }

  if (!isLikelyEmail(email)) {
    console.error(`[human-polish/email] ${key}: invalid recipient, skipping send`)
    return { sent: false, skipped: true, reason: "invalid_recipient", key }
  }

  const transactionalId = resolveTransactionalId(key)
  // Guard: template not provisioned in Loops yet → do not attempt a real send.
  if (!isProvisionedTransactionalId(transactionalId)) {
    console.warn(
      `[human-polish/email] ${key}: transactional template not provisioned; ` +
        `set the LOOPS_HP_* env var (see docs/human-polish-env.md). Skipping send.`
    )
    return { sent: false, skipped: true, reason: "template_not_provisioned", key }
  }

  try {
    const res = await fetch(`${LOOPS_API_BASE_URL}/transactional`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transactionalId, email, dataVariables }),
    })

    if (!res.ok) {
      // Log status only — never the recipient/body (may contain PII), never the key.
      console.error(`[human-polish/email] ${key}: Loops responded ${res.status}`)
      return { sent: false, skipped: false, reason: "http_error", key }
    }

    return { sent: true, skipped: false, key }
  } catch (err) {
    // Swallow: a transport failure must not break the caller's critical path.
    console.error(
      `[human-polish/email] ${key}: send threw`,
      err instanceof Error ? err.message : "unknown error"
    )
    return { sent: false, skipped: false, reason: "exception", key }
  }
}

// ---------------------------------------------------------------------------
// Small formatting helpers (kept here to avoid coupling callers to Loops).
// ---------------------------------------------------------------------------

/** Format integer minor units (cents) as a currency string, e.g. 34900 → "$349.00". */
export function formatAmountFromCents(
  amountCents: number,
  currency: string = HUMAN_POLISH_CURRENCY
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100)
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`
  }
}

function familyLabel(family: HumanPolishServiceFamily): string {
  return HUMAN_POLISH_SERVICE_FAMILY_LABELS[family]
}

// ---------------------------------------------------------------------------
// Shared param shapes
// ---------------------------------------------------------------------------

/** Fields every customer-facing milestone email needs. */
export interface HumanPolishEmailRecipient {
  /** Recipient email (from the intake contact record; never a browser payload). */
  to: string
  /** Optional display name used for greetings. */
  contactName?: string
  /** Short customer-facing request/order reference. */
  requestId: string
}

// §6.2 #1 — Draft/intake received (with recovery link)
export interface DraftReceivedEmailParams extends HumanPolishEmailRecipient {
  family: HumanPolishServiceFamily
  packageLabel: string
  /** Full recovery URL (token already embedded by the caller). */
  recoveryUrl?: string
  /** Minutes the recovery window stays open. Defaults to the spec's 15. */
  draftExpiresMinutes?: number
}

// §6.2 #2 — Payment received / order confirmation
export interface PaymentReceivedEmailParams extends HumanPolishEmailRecipient {
  family: HumanPolishServiceFamily
  packageLabel: string
  /** Server-authoritative amount in cents (from Stripe/session), formatted here. */
  amountCents?: number
  currency?: string
  /** Standard delivery target string (e.g. "24–48 hours"). */
  deliveryTarget?: string
  /** First-batch concept count for AI Render Packs. */
  firstBatchSize?: number
}

// §6.2 #3 — Files need replacement or more information
export interface FilesNeedInfoEmailParams extends HumanPolishEmailRecipient {
  /** Human-written explanation of what is needed. */
  message?: string
  /** Optional list of specific items/files being requested. */
  requestedItems?: string[]
  /**
   * Absolute URL for paid replacement uploads (Phase 6B).
   * Always supplied by adminRequestFilesNeedInfo after a successful update.
   * Phase 6C must wire this into the Loops Files Need Information template.
   */
  recoveryUrl?: string
}

// §6.2 #4 — Files accepted and delivery clock started
export interface FilesAcceptedEmailParams extends HumanPolishEmailRecipient {
  family: HumanPolishServiceFamily
  packageLabel: string
  deliveryTarget?: string
  firstBatchSize?: number
}

// §6.2 #5 — Rush request approved
export interface RushApprovedEmailParams extends HumanPolishEmailRecipient {
  /** Approved rush target, e.g. "Guaranteed 24-hour delivery". */
  rushTarget: string
  /** Rush fee in cents, formatted here when provided. */
  rushFeeCents?: number
  currency?: string
}

// §6.2 #6 — Rush not available, with standard-delivery option
export interface RushUnavailableEmailParams extends HumanPolishEmailRecipient {
  /** Standard delivery target offered instead. */
  standardDeliveryTarget: string
}

// §6.2 #7 — First batch ready (Brief-Match Guarantee review window)
export interface FirstBatchReadyEmailParams extends HumanPolishEmailRecipient {
  firstBatchSize: number
  /** Hours the customer has to flag a brief-match issue (spec: 24). */
  reviewWindowHours?: number
  /** Link to view the first batch. */
  reviewUrl?: string
}

// §6.2 #8 — Final delivery ready
export interface FinalDeliveryReadyEmailParams extends HumanPolishEmailRecipient {
  packageLabel: string
  /** Total concept count delivered (AI Render Pack). */
  conceptCount?: number
  /** Link to download the PNG + PDF deliverables. */
  downloadUrl?: string
}

// §6.2 #9 — Build-Ready scope approved
export interface BuildReadyScopeApprovedEmailParams extends HumanPolishEmailRecipient {
  packageLabel: string
  deliveryTarget?: string
  revisionRounds?: number
}

// §6.2 #10 — Build-Ready custom quote / more-information request
export interface BuildReadyQuoteEmailParams extends HumanPolishEmailRecipient {
  /** Quoted amount in cents (custom quote), formatted here when provided. */
  quotedAmountCents?: number
  currency?: string
  /** Human-written note (quote details or information requested). */
  message?: string
  /** Link to review/accept the quote. */
  quoteUrl?: string
}

// §6.2 #11 — Build-Ready payment requested
export interface BuildReadyPaymentRequestedEmailParams extends HumanPolishEmailRecipient {
  packageLabel: string
  /** Approved amount in cents to be paid, formatted here. */
  amountCents?: number
  currency?: string
  /**
   * Secure Build-Ready payment URL (`/human-polish/pay/...`).
   * Also mirrored as `checkoutUrl` for older Loops template drafts.
   */
  paymentUrl?: string
  /** @deprecated Prefer paymentUrl — kept as alias for Loops variable compatibility. */
  checkoutUrl?: string
}

// §6.2 #12 — Revision request received
export interface RevisionRequestReceivedEmailParams extends HumanPolishEmailRecipient {
  /** Which revision round this is (1-based). */
  revisionNumber?: number
  /** Summary of the requested revision. */
  message?: string
}

// §6.2 #13 — Final completion
export interface FinalCompletionEmailParams extends HumanPolishEmailRecipient {
  packageLabel: string
}

// §6.2 #14 — Rights / case-study permission request
export interface RightsPermissionRequestEmailParams extends HumanPolishEmailRecipient {
  /** Link where the customer can grant/decline feature permission. */
  permissionUrl?: string
}

// §6.2 #15 — Pack expiration reminder
export interface PackExpirationReminderEmailParams extends HumanPolishEmailRecipient {
  packageLabel: string
  /** Human-readable expiration date, e.g. "September 30, 2026". */
  expiresOnFormatted?: string
  /** Days remaining before the 90-day pack window closes. */
  daysRemaining?: number
}

// §6.2 — Internal team alert (default recipient frank@renderspace.ai)
export interface InternalTeamAlertEmailParams {
  /** Short subject/headline of the alert. */
  subject: string
  /** Optional request/order reference. */
  requestId?: string
  /** Optional short summary line. Avoid embedding customer PII. */
  summary?: string
  /** Optional deep link into the admin dashboard. */
  adminUrl?: string
  /** Override the default internal recipient. */
  to?: string
}

// ---------------------------------------------------------------------------
// Exported milestone functions (§6.2). Each is a safe, non-throwing wrapper.
// ---------------------------------------------------------------------------

/** §6.2 #1 — Draft/intake received; carries the 15-minute recovery link. */
export function sendDraftReceivedEmail(
  params: DraftReceivedEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "draft_received",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      serviceFamily: familyLabel(params.family),
      package: params.packageLabel,
      recoveryUrl: params.recoveryUrl,
      recoveryWindowMinutes: params.draftExpiresMinutes ?? HUMAN_POLISH_DRAFT_TTL_MINUTES,
    })
  )
}

/** §6.2 #2 — Payment received / order confirmation. */
export function sendPaymentReceivedEmail(
  params: PaymentReceivedEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "payment_received",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      serviceFamily: familyLabel(params.family),
      package: params.packageLabel,
      amount:
        typeof params.amountCents === "number"
          ? formatAmountFromCents(params.amountCents, params.currency)
          : undefined,
      deliveryTarget: params.deliveryTarget,
      firstBatchSize: params.firstBatchSize,
    })
  )
}

/** §6.2 #3 — Files need replacement or more information. */
export function sendFilesNeedInfoEmail(
  params: FilesNeedInfoEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "files_need_info",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      message: params.message,
      requestedItems:
        params.requestedItems && params.requestedItems.length > 0
          ? params.requestedItems.join(", ")
          : undefined,
      recoveryUrl: params.recoveryUrl,
    })
  )
}

/** §6.2 #4 — Files accepted; delivery clock started. */
export function sendFilesAcceptedEmail(
  params: FilesAcceptedEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "files_accepted",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      serviceFamily: familyLabel(params.family),
      package: params.packageLabel,
      deliveryTarget: params.deliveryTarget,
      firstBatchSize: params.firstBatchSize,
    })
  )
}

/** §6.2 #5 — Rush request approved. */
export function sendRushApprovedEmail(
  params: RushApprovedEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "rush_approved",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      rushTarget: params.rushTarget,
      rushFee:
        typeof params.rushFeeCents === "number"
          ? formatAmountFromCents(params.rushFeeCents, params.currency)
          : undefined,
    })
  )
}

/** §6.2 #6 — Rush not available; offer standard delivery. */
export function sendRushUnavailableEmail(
  params: RushUnavailableEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "rush_unavailable",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      standardDeliveryTarget: params.standardDeliveryTarget,
    })
  )
}

/** §6.2 #7 — First batch ready (24h Brief-Match Guarantee review window). */
export function sendFirstBatchReadyEmail(
  params: FirstBatchReadyEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "first_batch_ready",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      firstBatchSize: params.firstBatchSize,
      reviewWindowHours: params.reviewWindowHours ?? 24,
      reviewUrl: params.reviewUrl,
    })
  )
}

/** §6.2 #8 — Final delivery ready (PNG + PDF). */
export function sendFinalDeliveryReadyEmail(
  params: FinalDeliveryReadyEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "final_delivery_ready",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      package: params.packageLabel,
      conceptCount: params.conceptCount,
      downloadUrl: params.downloadUrl,
    })
  )
}

/** §6.2 #9 — Build-Ready scope approved. */
export function sendBuildReadyScopeApprovedEmail(
  params: BuildReadyScopeApprovedEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "build_ready_scope_approved",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      package: params.packageLabel,
      deliveryTarget: params.deliveryTarget,
      revisionRounds: params.revisionRounds,
    })
  )
}

/** §6.2 #10 — Build-Ready custom quote or more-information request. */
export function sendBuildReadyQuoteEmail(
  params: BuildReadyQuoteEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "build_ready_quote",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      quotedAmount:
        typeof params.quotedAmountCents === "number"
          ? formatAmountFromCents(params.quotedAmountCents, params.currency)
          : undefined,
      message: params.message,
      quoteUrl: params.quoteUrl,
    })
  )
}

/** §6.2 #11 — Build-Ready payment requested. */
export function sendBuildReadyPaymentRequestedEmail(
  params: BuildReadyPaymentRequestedEmailParams
): Promise<HumanPolishEmailResult> {
  const paymentUrl = params.paymentUrl || params.checkoutUrl
  return dispatchTransactional(
    "build_ready_payment_requested",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      package: params.packageLabel,
      amount:
        typeof params.amountCents === "number"
          ? formatAmountFromCents(params.amountCents, params.currency)
          : undefined,
      paymentUrl,
      checkoutUrl: paymentUrl,
    })
  )
}

/** §6.2 #12 — Revision request received. */
export function sendRevisionRequestReceivedEmail(
  params: RevisionRequestReceivedEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "revision_request_received",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      revisionNumber: params.revisionNumber,
      message: params.message,
    })
  )
}

/** §6.2 #13 — Final completion. */
export function sendFinalCompletionEmail(
  params: FinalCompletionEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "final_completion",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      package: params.packageLabel,
    })
  )
}

/** §6.2 #14 — Rights / case-study permission request. */
export function sendRightsPermissionRequestEmail(
  params: RightsPermissionRequestEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "rights_permission_request",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      permissionUrl: params.permissionUrl,
    })
  )
}

/** §6.2 #15 — Pack expiration reminder (90-day window). */
export function sendPackExpirationReminderEmail(
  params: PackExpirationReminderEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "pack_expiration_reminder",
    params.to,
    compactVariables({
      contactName: params.contactName,
      requestId: params.requestId,
      package: params.packageLabel,
      expiresOn: params.expiresOnFormatted,
      daysRemaining: params.daysRemaining,
      packWindowDays: AI_RENDER_PACK_EXPIRATION_DAYS,
    })
  )
}

/**
 * §6.2 — Internal team alert. Defaults to frank@renderspace.ai (override with
 * `LOOPS_HP_INTERNAL_ALERT_EMAIL`). Uses its own transactional template.
 */
export function sendInternalTeamAlertEmail(
  params: InternalTeamAlertEmailParams
): Promise<HumanPolishEmailResult> {
  return dispatchTransactional(
    "internal_alert",
    params.to ?? getInternalAlertEmail(),
    compactVariables({
      subject: params.subject,
      requestId: params.requestId,
      summary: params.summary,
      adminUrl: params.adminUrl,
    })
  )
}

// Re-export the event-name map so analytics/automation callers can key off the
// same milestone taxonomy without importing the templates module directly.
export { HUMAN_POLISH_EVENT_NAMES }
