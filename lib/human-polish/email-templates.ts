/**
 * Human Polish™ V1 — Loops transactional template + event mapping.
 * Source of truth: docs/human-polish-v1-spec.md (§6.2 milestone communication,
 * §13 Email Agent ownership).
 *
 * This file only declares CONSTANTS (template IDs, event names, addresses).
 * The send logic lives in ./email.ts. Nothing here sends email or reads secrets.
 *
 * Loops has two send mechanisms:
 *   - Transactional API (`/transactional`)  — one specific template per email,
 *     addressed with `dataVariables`. This is what the milestone emails use.
 *   - Events API (`/events/send`)           — used by the existing integration
 *     (`lib/loops.ts`) to trigger loops/campaigns. We also record an event name
 *     per milestone so analytics/automations can key off the same taxonomy.
 *
 * TEMPLATE IDs MUST BE PROVISIONED BY A HUMAN in the Loops dashboard. Until then
 * the resolved id remains a `TODO_` placeholder and `email.ts` treats the send as
 * a guarded no-op (see resolveTransactionalId + isProvisionedTransactionalId).
 */

// ---------------------------------------------------------------------------
// Milestone keys — one per §6.2 required V1 communication event (1–15), plus
// the internal-alert channel (§6.2: "Internal alerts should go to frank@…").
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_EMAIL_KEYS = [
  "draft_received", // §6.2 #1  Draft/intake received
  "payment_received", // §6.2 #2  Payment received
  "files_need_info", // §6.2 #3  Files need replacement or more information
  "files_accepted", // §6.2 #4  Files accepted and delivery clock started
  "rush_approved", // §6.2 #5  Rush request approved
  "rush_unavailable", // §6.2 #6  Rush request not available (standard-delivery option)
  "first_batch_ready", // §6.2 #7  First batch ready
  "final_delivery_ready", // §6.2 #8  Final delivery ready
  "build_ready_scope_approved", // §6.2 #9  Build-Ready scope approved
  "build_ready_quote", // §6.2 #10 Build-Ready custom quote / more-info request
  "build_ready_payment_requested", // §6.2 #11 Build-Ready payment requested
  "revision_request_received", // §6.2 #12 Revision request received
  "final_completion", // §6.2 #13 Final completion
  "rights_permission_request", // §6.2 #14 Rights/case-study permission request
  "pack_expiration_reminder", // §6.2 #15 Pack expiration reminder
  "internal_alert", // §6.2   Internal alert to the Renderspace team
] as const

export type HumanPolishEmailKey = (typeof HUMAN_POLISH_EMAIL_KEYS)[number]

// ---------------------------------------------------------------------------
// Internal alert destination (§6.2 / §5.2). Override with LOOPS_HP_INTERNAL_ALERT_EMAIL.
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_DEFAULT_INTERNAL_ALERT_EMAIL = "frank@renderspace.ai" as const

export function getInternalAlertEmail(): string {
  const override = process.env.LOOPS_HP_INTERNAL_ALERT_EMAIL?.trim()
  return override && override.length > 0
    ? override
    : HUMAN_POLISH_DEFAULT_INTERNAL_ALERT_EMAIL
}

// ---------------------------------------------------------------------------
// Loops event names (mirrors existing snake_case event taxonomy in lib/loops.ts).
// These let a Loops "Event" automation or analytics key off the same milestone.
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_EVENT_NAMES: Record<HumanPolishEmailKey, string> = {
  draft_received: "hp_draft_received",
  payment_received: "hp_payment_received",
  files_need_info: "hp_files_need_info",
  files_accepted: "hp_files_accepted",
  rush_approved: "hp_rush_approved",
  rush_unavailable: "hp_rush_unavailable",
  first_batch_ready: "hp_first_batch_ready",
  final_delivery_ready: "hp_final_delivery_ready",
  build_ready_scope_approved: "hp_build_ready_scope_approved",
  build_ready_quote: "hp_build_ready_quote",
  build_ready_payment_requested: "hp_build_ready_payment_requested",
  revision_request_received: "hp_revision_request_received",
  final_completion: "hp_final_completion",
  rights_permission_request: "hp_rights_permission_request",
  pack_expiration_reminder: "hp_pack_expiration_reminder",
  internal_alert: "hp_internal_alert",
}

// ---------------------------------------------------------------------------
// Transactional template IDs.
//
// Each milestone maps to a Loops transactional template. The real id is created
// in the Loops dashboard and supplied via the env var named below. Until then the
// placeholder (prefixed `TODO_`) is used and the send is a guarded no-op.
//
// Env var names are documented in docs/human-polish-env.md.
// ---------------------------------------------------------------------------

/** Env var that carries the real Loops transactional id for each milestone. */
export const HUMAN_POLISH_TEMPLATE_ENV_VARS: Record<HumanPolishEmailKey, string> = {
  draft_received: "LOOPS_HP_DRAFT_RECEIVED_TEMPLATE_ID",
  payment_received: "LOOPS_HP_PAYMENT_RECEIVED_TEMPLATE_ID",
  files_need_info: "LOOPS_HP_FILES_NEED_INFO_TEMPLATE_ID",
  files_accepted: "LOOPS_HP_FILES_ACCEPTED_TEMPLATE_ID",
  rush_approved: "LOOPS_HP_RUSH_APPROVED_TEMPLATE_ID",
  rush_unavailable: "LOOPS_HP_RUSH_UNAVAILABLE_TEMPLATE_ID",
  first_batch_ready: "LOOPS_HP_FIRST_BATCH_READY_TEMPLATE_ID",
  final_delivery_ready: "LOOPS_HP_FINAL_DELIVERY_READY_TEMPLATE_ID",
  build_ready_scope_approved: "LOOPS_HP_BUILD_READY_SCOPE_APPROVED_TEMPLATE_ID",
  build_ready_quote: "LOOPS_HP_BUILD_READY_QUOTE_TEMPLATE_ID",
  build_ready_payment_requested: "LOOPS_HP_BUILD_READY_PAYMENT_REQUESTED_TEMPLATE_ID",
  revision_request_received: "LOOPS_HP_REVISION_REQUEST_RECEIVED_TEMPLATE_ID",
  final_completion: "LOOPS_HP_FINAL_COMPLETION_TEMPLATE_ID",
  rights_permission_request: "LOOPS_HP_RIGHTS_PERMISSION_REQUEST_TEMPLATE_ID",
  pack_expiration_reminder: "LOOPS_HP_PACK_EXPIRATION_REMINDER_TEMPLATE_ID",
  internal_alert: "LOOPS_HP_INTERNAL_ALERT_TEMPLATE_ID",
}

/**
 * Placeholder id used when the env var is unset. Kept distinctive so
 * isProvisionedTransactionalId() can reliably detect an un-provisioned template.
 * TODO(human/loops-admin): provision the real transactional templates in Loops
 * and set the env vars above; these placeholders never send.
 */
function placeholderTransactionalId(key: HumanPolishEmailKey): string {
  return `TODO_LOOPS_HP_TEMPLATE__${key}`
}

/** True when the id looks like a real Loops template (not a TODO placeholder). */
export function isProvisionedTransactionalId(id: string | undefined | null): boolean {
  return typeof id === "string" && id.length > 0 && !id.startsWith("TODO_")
}

/**
 * Resolve the transactional id for a milestone from the environment, falling
 * back to a TODO placeholder. Never throws.
 */
export function resolveTransactionalId(key: HumanPolishEmailKey): string {
  const envValue = process.env[HUMAN_POLISH_TEMPLATE_ENV_VARS[key]]?.trim()
  return envValue && envValue.length > 0 ? envValue : placeholderTransactionalId(key)
}
