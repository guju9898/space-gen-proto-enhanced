import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { decideAttribution } from "@/lib/affiliates/attribution"
import { generateAffiliateCode, normalizeAffiliateCode, sanitizeLandingPath } from "@/lib/affiliates/codes"
import {
  basisFromInvoiceTotals,
  commissionEndsAt,
  decideCommission,
  reversalAmountCents,
  type CommissionDecision,
} from "@/lib/affiliates/commission"
import { parseAffiliateCookie, serializeAffiliateCookie } from "@/lib/affiliates/cookie"
import {
  affiliatesEnabled,
  programIsLive,
  PROPOSED_PROGRAM,
  type AffiliateProgramConfig,
  type ProgramStatus,
} from "@/lib/affiliates/config"
import { decidePayout, type PayoutStatus } from "@/lib/affiliates/payout"

type DbError = { code?: string; message?: string } | null

export type AffiliateAccount = {
  id: string
  user_id: string
  status: "pending" | "approved" | "rejected" | "suspended"
  display_name: string
  partner_type: string
  website: string | null
  note: string | null
  code: string | null
  commission_bps: number | null
}

export function getAffiliateService(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function missingRelation(error: DbError): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205"
}

function uniqueViolation(error: DbError): boolean {
  return error?.code === "23505"
}

export function mapProgram(row: Record<string, unknown> | null): AffiliateProgramConfig | null {
  if (!row) return null
  const status = row.status
  if (status !== "draft" && status !== "active" && status !== "paused") return null
  return {
    status,
    maxCommissionBps: Number(row.max_commission_bps),
    attributionWindowDays: Number(row.attribution_window_days),
    commissionWindowDays: Number(row.commission_window_days),
    holdDays: Number(row.hold_days),
    customerDiscountPercent: Number(row.customer_discount_percent),
  }
}

export async function loadProgram(supabase: SupabaseClient): Promise<AffiliateProgramConfig | null> {
  const { data, error } = await supabase
    .from("affiliate_program_config")
    .select("status, max_commission_bps, attribution_window_days, commission_window_days, hold_days, customer_discount_percent")
    .eq("id", "default")
    .maybeSingle()
  if (error) {
    if (missingRelation(error)) return null
    throw error
  }
  return mapProgram(data as Record<string, unknown> | null)
}

async function approvedAccountByCode(
  supabase: SupabaseClient,
  code: string
): Promise<AffiliateAccount | null> {
  const { data, error } = await supabase
    .from("affiliate_accounts")
    .select("id, user_id, status, display_name, partner_type, website, note, code, commission_bps")
    .eq("code", code)
    .eq("status", "approved")
    .maybeSingle()
  if (error) {
    if (missingRelation(error)) return null
    throw error
  }
  return (data as AffiliateAccount | null) ?? null
}

export async function captureReferralClick(input: {
  supabase: SupabaseClient
  code: string
  path: string | null
  now: Date
  existingCookie: string | null
  existingVisitorId: string | null
  enabled?: boolean
}): Promise<{ captured: boolean; cookieValue: string | null; visitorId: string | null }> {
  const enabled = input.enabled ?? affiliatesEnabled()
  if (!enabled) return { captured: false, cookieValue: null, visitorId: null }
  const code = normalizeAffiliateCode(input.code)
  if (!code) return { captured: false, cookieValue: null, visitorId: null }
  let program: AffiliateProgramConfig | null
  try {
    program = await loadProgram(input.supabase)
  } catch {
    return { captured: false, cookieValue: null, visitorId: null }
  }
  if (!programIsLive(program, enabled)) return { captured: false, cookieValue: null, visitorId: null }
  const existing = parseAffiliateCookie(input.existingCookie, input.now, program!.attributionWindowDays)
  const account = await approvedAccountByCode(input.supabase, existing?.code ?? code)
  if (!account) return { captured: false, cookieValue: null, visitorId: null }
  const visitorId = input.existingVisitorId && /^[0-9a-f-]{36}$/i.test(input.existingVisitorId)
    ? input.existingVisitorId
    : crypto.randomUUID()
  if (!existing) {
    const { error } = await input.supabase.from("affiliate_clicks").insert({
      affiliate_id: account.id,
      visitor_id: visitorId,
      landing_path: sanitizeLandingPath(input.path),
    })
    if (error && !uniqueViolation(error)) {
      return { captured: false, cookieValue: null, visitorId: null }
    }
  }
  const cookieValue = existing
    ? input.existingCookie
    : serializeAffiliateCookie(code, input.now)
  return { captured: true, cookieValue, visitorId }
}

export async function bindReferral(input: {
  supabase: SupabaseClient
  userId: string
  cookieValue: string | null
  bodyCode?: string | null
  now?: Date
  enabled?: boolean
}): Promise<{ bound: boolean; reason: string }> {
  const enabled = input.enabled ?? affiliatesEnabled()
  const now = input.now ?? new Date()
  if (!enabled) return { bound: false, reason: "program_inactive" }
  let program: AffiliateProgramConfig | null
  try {
    program = await loadProgram(input.supabase)
  } catch {
    return { bound: false, reason: "unavailable" }
  }
  const live = programIsLive(program, enabled)
  if (!live || !program) return { bound: false, reason: "program_inactive" }
  const parsed = parseAffiliateCookie(input.cookieValue, now, program.attributionWindowDays)
  const cookieExpired = Boolean(input.cookieValue) && !parsed
  const { data: existing } = await input.supabase
    .from("affiliate_attributions")
    .select("code")
    .eq("referred_user_id", input.userId)
    .maybeSingle()
  const account = parsed ? await approvedAccountByCode(input.supabase, parsed.code) : null
  const decision = decideAttribution({
    programActive: live,
    cookieCode: parsed?.code ?? null,
    cookieExpired,
    bodyCode: input.bodyCode,
    affiliateStatus: account?.status ?? "missing",
    affiliateUserId: account?.user_id ?? null,
    customerUserId: input.userId,
    existingCode: (existing?.code as string | undefined) ?? null,
  })
  if (decision.action !== "bind" || !account || !parsed) return { bound: false, reason: decision.reason }
  const { error } = await input.supabase.from("affiliate_attributions").insert({
    affiliate_id: account.id,
    referred_user_id: input.userId,
    code: parsed.code,
  })
  if (error) {
    if (uniqueViolation(error)) return { bound: false, reason: "already_attributed" }
    if (missingRelation(error)) return { bound: false, reason: "unavailable" }
    throw error
  }
  return { bound: true, reason: "ok" }
}

export async function resolveCheckoutAffiliate(input: {
  supabase: SupabaseClient
  userId: string
  cookieValue: string | null
  now?: Date
  enabled?: boolean
}): Promise<{
  hasAffiliate: boolean
  code: string | null
  programActive: boolean
  customerDiscountPercent: number
}> {
  const enabled = input.enabled ?? affiliatesEnabled()
  const now = input.now ?? new Date()
  const empty = { hasAffiliate: false, code: null, programActive: false, customerDiscountPercent: 0 }
  if (!enabled) return empty
  try {
    await bindReferral({ ...input, enabled, now })
  } catch {
    return empty
  }
  const program = await loadProgram(input.supabase).catch(() => null)
  if (!programIsLive(program, enabled) || !program) return empty
  const { data: attribution } = await input.supabase
    .from("affiliate_attributions")
    .select("code, affiliate_id")
    .eq("referred_user_id", input.userId)
    .maybeSingle()
  if (!attribution?.code) {
    return { ...empty, programActive: true, customerDiscountPercent: program.customerDiscountPercent }
  }
  const { data: account } = await input.supabase
    .from("affiliate_accounts")
    .select("user_id")
    .eq("id", attribution.affiliate_id)
    .maybeSingle()
  const selfReferral = account?.user_id === input.userId
  return {
    hasAffiliate: !selfReferral,
    code: selfReferral ? null : String(attribution.code),
    programActive: true,
    customerDiscountPercent: program.customerDiscountPercent,
  }
}

type PaymentInput = {
  supabase: SupabaseClient
  enabled?: boolean
  eventId: string
  invoiceId: string
  chargeId: string | null
  userId: string
  paidAt: Date
  billingReason: string | null
  currency: string
  amountPaidCents: number
  totalCents: number | null
  totalExcludingTaxCents: number | null
}

export async function recordSubscriptionPayment(input: PaymentInput): Promise<{ retry: boolean }> {
  const enabled = input.enabled ?? affiliatesEnabled()
  if (!enabled) return { retry: false }
  let program: AffiliateProgramConfig | null
  try {
    program = await loadProgram(input.supabase)
  } catch (error) {
    const dbError = error as DbError
    if (missingRelation(dbError)) return { retry: false }
    return { retry: true }
  }
  if (!program || !programIsLive(program, enabled)) return { retry: false }

  const { data: attribution, error: attributionError } = await input.supabase
    .from("affiliate_attributions")
    .select("id, affiliate_id, code, commission_ends_at")
    .eq("referred_user_id", input.userId)
    .maybeSingle()
  if (attributionError) return { retry: !missingRelation(attributionError) }
  if (!attribution) return { retry: false }

  const { data: account } = await input.supabase
    .from("affiliate_accounts")
    .select("user_id, commission_bps, status")
    .eq("id", attribution.affiliate_id)
    .maybeSingle()
  const { data: existingEarn } = await input.supabase
    .from("affiliate_commissions")
    .select("id")
    .eq("stripe_invoice_id", input.invoiceId)
    .eq("kind", "earn")
    .maybeSingle()

  if (!account || account.status !== "approved" || account.commission_bps === null) return { retry: false }
  const totals = basisFromInvoiceTotals({
    amountPaidCents: input.amountPaidCents,
    totalCents: input.totalCents,
    totalExcludingTaxCents: input.totalExcludingTaxCents,
  })
  const decision: CommissionDecision = decideCommission({
    programActive: true,
    selfReferral: account.user_id === input.userId,
    hasAttribution: true,
    paidAt: input.paidAt,
    commissionEndsAt: attribution.commission_ends_at ? new Date(attribution.commission_ends_at) : null,
    billingReason: input.billingReason,
    currency: input.currency,
    amountPaidCents: input.amountPaidCents,
    taxCents: input.amountPaidCents - totals.basisCents,
    commissionBps: Number(account.commission_bps),
    maxBps: program.maxCommissionBps,
    duplicateInvoice: Boolean(existingEarn),
  })
  if (decision.action !== "earn") return { retry: false }

  const availableAt = new Date(input.paidAt.getTime() + program.holdDays * 24 * 60 * 60 * 1000)
  const { error } = await input.supabase.from("affiliate_commissions").insert({
    affiliate_id: attribution.affiliate_id,
    attribution_id: attribution.id,
    referred_user_id: input.userId,
    stripe_event_id: input.eventId,
    stripe_invoice_id: input.invoiceId,
    stripe_charge_id: input.chargeId,
    kind: "earn",
    status: "pending",
    basis_cents: decision.basisCents,
    commission_bps: decision.commissionBps,
    amount_cents: decision.amountCents,
    currency: "usd",
    available_at: availableAt.toISOString(),
    reason: "subscription_payment",
  })
  if (error) {
    if (uniqueViolation(error) || missingRelation(error)) return { retry: false }
    return { retry: true }
  }
  if (!attribution.commission_ends_at) {
    await input.supabase
      .from("affiliate_attributions")
      .update({
        commission_ends_at: commissionEndsAt(input.paidAt, program.commissionWindowDays).toISOString(),
      })
      .eq("id", attribution.id)
      .is("commission_ends_at", null)
  }
  return { retry: false }
}

async function writeReversal(input: {
  supabase: SupabaseClient
  eventId: string
  invoiceId: string | null
  chargeId: string | null
  amountRefundedCents: number
  reason: string
  enabled?: boolean
}): Promise<{ retry: boolean }> {
  const enabled = input.enabled ?? affiliatesEnabled()
  if (!enabled) return { retry: false }
  const program = await loadProgram(input.supabase).catch((error: DbError) => {
    if (missingRelation(error)) return PROPOSED_PROGRAM
    throw error
  })
  if (!programIsLive(program, enabled)) return { retry: false }
  let query = input.supabase
    .from("affiliate_commissions")
    .select("id, affiliate_id, attribution_id, referred_user_id, amount_cents, basis_cents, stripe_invoice_id, stripe_charge_id, status, payout_id")
    .eq("kind", "earn")
  query = input.invoiceId
    ? query.eq("stripe_invoice_id", input.invoiceId)
    : query.eq("stripe_charge_id", input.chargeId ?? "")
  const { data: earn, error } = await query.maybeSingle()
  if (error) return { retry: !missingRelation(error) }
  if (!earn || earn.status === "void") return { retry: false }
  const { data: reversals } = await input.supabase
    .from("affiliate_commissions")
    .select("amount_cents")
    .eq("reversal_of", earn.id)
    .eq("kind", "reversal")
  const already = (reversals ?? []).reduce((sum, row) => sum + Number(row.amount_cents), 0)
  const amountPaid = Number(earn.basis_cents) > 0 ? Number(earn.basis_cents) : Number(earn.amount_cents)
  const amount = reversalAmountCents({
    originalAmountCents: Number(earn.amount_cents),
    alreadyReversedCents: already,
    amountPaidCents: amountPaid,
    amountRefundedCents: input.amountRefundedCents,
  })
  if (amount <= 0) return { retry: false }
  const { error: insertError } = await input.supabase.from("affiliate_commissions").insert({
    affiliate_id: earn.affiliate_id,
    attribution_id: earn.attribution_id,
    referred_user_id: earn.referred_user_id,
    stripe_event_id: input.eventId,
    stripe_invoice_id: earn.stripe_invoice_id,
    stripe_charge_id: input.chargeId ?? earn.stripe_charge_id,
    kind: "reversal",
    status: "approved",
    basis_cents: 0,
    commission_bps: 0,
    amount_cents: amount,
    reversal_of: earn.id,
    reason: input.reason,
  })
  if (insertError) {
    if (uniqueViolation(insertError) || missingRelation(insertError)) return { retry: false }
    return { retry: true }
  }
  if (already + amount >= Number(earn.amount_cents) && earn.status !== "paid") {
    await input.supabase.from("affiliate_commissions").update({ status: "reversed" }).eq("id", earn.id)
  }
  return { retry: false }
}

export function refundReversalBasis(amountPaidCents: number, amountRefundedCents: number, originalBasisCents: number): number {
  if (amountPaidCents <= 0 || amountRefundedCents <= 0) return 0
  if (amountRefundedCents >= amountPaidCents) return originalBasisCents
  return Math.floor((originalBasisCents * amountRefundedCents) / amountPaidCents)
}

export async function recordChargeRefund(input: {
  supabase: SupabaseClient
  eventId: string
  invoiceId: string | null
  chargeId: string | null
  amountPaidCents: number
  amountRefundedCents: number
  enabled?: boolean
}): Promise<{ retry: boolean }> {
  const enabled = input.enabled ?? affiliatesEnabled()
  if (!enabled) return { retry: false }
  const program = await loadProgram(input.supabase).catch(() => null)
  if (!program || !programIsLive(program, enabled)) return { retry: false }
  let query = input.supabase
    .from("affiliate_commissions")
    .select("id, amount_cents, basis_cents")
    .eq("kind", "earn")
  query = input.invoiceId ? query.eq("stripe_invoice_id", input.invoiceId) : query.eq("stripe_charge_id", input.chargeId ?? "")
  const { data: earn } = await query.maybeSingle()
  if (!earn) return { retry: false }
  const refundedBasis = refundReversalBasis(
    input.amountPaidCents,
    input.amountRefundedCents,
    Number(earn.basis_cents) || Number(earn.amount_cents)
  )
  return writeReversal({
    supabase: input.supabase,
    eventId: input.eventId,
    invoiceId: input.invoiceId,
    chargeId: input.chargeId,
    amountRefundedCents: refundedBasis,
    reason: "refund",
    enabled,
  })
}

export async function recordDispute(input: {
  supabase: SupabaseClient
  eventId: string
  invoiceId: string | null
  chargeId: string | null
  open: boolean
  enabled?: boolean
}): Promise<{ retry: boolean }> {
  if (!input.open) return { retry: false }
  const { data } = await input.supabase
    .from("affiliate_commissions")
    .select("basis_cents, amount_cents")
    .eq("kind", "earn")
    .eq("stripe_charge_id", input.chargeId ?? "")
    .maybeSingle()
  return writeReversal({
    supabase: input.supabase,
    eventId: input.eventId,
    invoiceId: input.invoiceId,
    chargeId: input.chargeId,
    amountRefundedCents: Number(data?.basis_cents ?? data?.amount_cents ?? 0),
    reason: "dispute",
    enabled: input.enabled,
  })
}

const PARTNER_TYPES = new Set(["landscaping", "pool", "educator", "creator", "consultant", "other"])

export async function applyForAffiliate(input: {
  supabase: SupabaseClient
  userId: string
  displayName: string
  partnerType: string
  website: string | null
  note: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const displayName = input.displayName.trim()
  if (displayName.length < 2 || displayName.length > 80) return { ok: false, error: "Enter a name between 2 and 80 characters." }
  if (!PARTNER_TYPES.has(input.partnerType)) return { ok: false, error: "Choose a partner type." }
  const website = input.website?.trim() || null
  if (website && !/^https:\/\/\S{3,180}$/i.test(website)) return { ok: false, error: "Website must be an https URL." }
  const note = input.note?.trim().slice(0, 500) || null
  const { error } = await input.supabase.from("affiliate_accounts").insert({
    user_id: input.userId,
    display_name: displayName,
    partner_type: input.partnerType,
    website,
    note,
    status: "pending",
  })
  if (error) {
    if (uniqueViolation(error)) return { ok: false, error: "An application already exists for this account." }
    if (missingRelation(error)) return { ok: false, error: "Affiliate applications are not available yet." }
    return { ok: false, error: "Could not save the application." }
  }
  return { ok: true }
}

export async function approveAffiliate(input: {
  supabase: SupabaseClient
  accountId: string
  commissionBps: number
}): Promise<{ ok: boolean; error?: string }> {
  const program = (await loadProgram(input.supabase)) ?? PROPOSED_PROGRAM
  const rate = Math.floor(input.commissionBps)
  if (rate < 0 || rate > program.maxCommissionBps || rate > 2500) {
    return { ok: false, error: "Commission rate is above the configured maximum." }
  }
  const { data: existing } = await input.supabase
    .from("affiliate_accounts")
    .select("code")
    .eq("id", input.accountId)
    .maybeSingle()
  let code = existing?.code ? String(existing.code) : null
  for (let attempt = 0; attempt < 5 && !code; attempt += 1) {
    const candidate = generateAffiliateCode()
    const { data: clash } = await input.supabase
      .from("affiliate_accounts")
      .select("id")
      .eq("code", candidate)
      .maybeSingle()
    if (!clash) code = candidate
  }
  if (!code) return { ok: false, error: "Could not assign a referral code." }
  const { error } = await input.supabase
    .from("affiliate_accounts")
    .update({ status: "approved", code, commission_bps: rate, updated_at: new Date().toISOString() })
    .eq("id", input.accountId)
  if (error) return { ok: false, error: "Could not approve the application." }
  return { ok: true }
}

export async function setAffiliateStatus(input: {
  supabase: SupabaseClient
  accountId: string
  status: "rejected" | "suspended"
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await input.supabase
    .from("affiliate_accounts")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.accountId)
  if (error) return { ok: false, error: "Could not update the account." }
  return { ok: true }
}

export async function setProgramStatus(input: {
  supabase: SupabaseClient
  status: ProgramStatus
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await input.supabase
    .from("affiliate_program_config")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", "default")
  if (error) return { ok: false, error: "Could not update program status." }
  return { ok: true }
}

export async function reverseCommission(input: {
  supabase: SupabaseClient
  commissionId: string
}): Promise<{ ok: boolean; error?: string }> {
  const { data: earn } = await input.supabase
    .from("affiliate_commissions")
    .select("id, amount_cents, basis_cents, status, payout_id, stripe_invoice_id, stripe_charge_id, affiliate_id, attribution_id, referred_user_id")
    .eq("id", input.commissionId)
    .eq("kind", "earn")
    .maybeSingle()
  if (!earn) return { ok: false, error: "Commission was not found." }
  if (earn.payout_id) {
    const { data: payout } = await input.supabase
      .from("affiliate_payouts")
      .select("status")
      .eq("id", earn.payout_id)
      .maybeSingle()
    if (payout && payout.status !== "rejected" && payout.status !== "paid") {
      return { ok: false, error: "Reject the open payout before reversing this commission." }
    }
  }
  const result = await writeReversal({
    supabase: input.supabase,
    eventId: `manual:${earn.id}`,
    invoiceId: earn.stripe_invoice_id,
    chargeId: earn.stripe_charge_id,
    amountRefundedCents: Number(earn.basis_cents) || Number(earn.amount_cents),
    reason: "admin_reversal",
  })
  if (result.retry) return { ok: false, error: "Could not reverse the commission." }
  return { ok: true }
}

export async function requestPayout(input: {
  supabase: SupabaseClient
  userId: string
  now?: Date
}): Promise<{ ok: boolean; error?: string }> {
  const now = input.now ?? new Date()
  const { data: account } = await input.supabase
    .from("affiliate_accounts")
    .select("id, status")
    .eq("user_id", input.userId)
    .maybeSingle()
  if (!account || account.status !== "approved") return { ok: false, error: "This account cannot request a payout." }
  const { data: openPayout } = await input.supabase
    .from("affiliate_payouts")
    .select("id")
    .eq("affiliate_id", account.id)
    .in("status", ["requested", "approved"])
    .maybeSingle()
  if (openPayout) return { ok: false, error: "A payout is already awaiting review." }
  const { data: commissions } = await input.supabase
    .from("affiliate_commissions")
    .select("id, amount_cents, kind, status, available_at, reversal_of, payout_id")
    .eq("affiliate_id", account.id)
  const rows = commissions ?? []
  const reversed = new Map<string, number>()
  for (const row of rows) {
    if (row.kind !== "reversal" || !row.reversal_of) continue
    reversed.set(row.reversal_of, (reversed.get(row.reversal_of) ?? 0) + Number(row.amount_cents))
  }
  const include = rows.filter((row) => {
    if (row.kind !== "earn" || row.status !== "approved" || row.payout_id) return false
    if (!row.available_at || new Date(row.available_at).getTime() > now.getTime()) return false
    const net = Number(row.amount_cents) - (reversed.get(row.id) ?? 0)
    return net > 0
  })
  const amount = include.reduce((sum, row) => sum + Number(row.amount_cents) - (reversed.get(row.id) ?? 0), 0)
  if (amount <= 0) return { ok: false, error: "No approved commission is ready for payout." }
  const { data: payout, error } = await input.supabase
    .from("affiliate_payouts")
    .insert({ affiliate_id: account.id, amount_cents: amount, status: "requested" })
    .select("id")
    .single()
  if (error || !payout) return { ok: false, error: "Could not request a payout." }
  await input.supabase
    .from("affiliate_commissions")
    .update({ payout_id: payout.id })
    .in("id", include.map((row) => row.id))
  return { ok: true }
}

export async function transitionPayout(input: {
  supabase: SupabaseClient
  payoutId: string
  action: "approve" | "reject" | "mark_paid"
  externalReference?: string | null
  now?: Date
}): Promise<{ ok: boolean; error?: string }> {
  const now = input.now ?? new Date()
  const { data: payout } = await input.supabase
    .from("affiliate_payouts")
    .select("id, status, amount_cents")
    .eq("id", input.payoutId)
    .maybeSingle()
  if (!payout) return { ok: false, error: "Payout was not found." }
  const { data: linked } = await input.supabase
    .from("affiliate_commissions")
    .select("available_at")
    .eq("payout_id", payout.id)
    .eq("kind", "earn")
  const times = (linked ?? [])
    .map((row) => (row.available_at ? new Date(row.available_at).getTime() : null))
    .filter((value): value is number => value !== null)
  const earliest = times.length ? new Date(Math.min(...times)) : null
  const decision = decidePayout({
    status: payout.status as PayoutStatus,
    action: input.action,
    now,
    earliestAvailableAt: earliest,
    amountCents: Number(payout.amount_cents),
    externalReference: input.externalReference,
  })
  if (!decision.ok || !decision.next) return { ok: false, error: "That payout change is not allowed yet." }
  const patch: Record<string, string | null> = { status: decision.next }
  if (decision.next === "approved") patch.approved_at = now.toISOString()
  if (decision.next === "paid") {
    patch.paid_at = now.toISOString()
    patch.external_reference = input.externalReference?.trim() ?? null
  }
  const { error } = await input.supabase.from("affiliate_payouts").update(patch).eq("id", payout.id).eq("status", payout.status)
  if (error) return { ok: false, error: "Could not update the payout." }
  if (decision.next === "rejected") {
    await input.supabase.from("affiliate_commissions").update({ payout_id: null }).eq("payout_id", payout.id).eq("kind", "earn")
  }
  if (decision.next === "paid") {
    await input.supabase
      .from("affiliate_commissions")
      .update({ status: "paid" })
      .eq("payout_id", payout.id)
      .eq("kind", "earn")
      .eq("status", "approved")
  }
  return { ok: true }
}

export async function approveReadyCommissions(input: {
  supabase: SupabaseClient
  now?: Date
}): Promise<void> {
  const now = input.now ?? new Date()
  await input.supabase
    .from("affiliate_commissions")
    .update({ status: "approved" })
    .eq("kind", "earn")
    .eq("status", "pending")
    .lte("available_at", now.toISOString())
    .is("payout_id", null)
}
