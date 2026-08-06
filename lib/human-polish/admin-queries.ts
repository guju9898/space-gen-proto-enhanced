import type { SupabaseClient } from "@supabase/supabase-js"
import {
  ADMIN_LIST_PAGE_SIZE,
  isUuid,
  parseFamilyParam,
  parsePackageParam,
  parsePaymentStatusParam,
  parseRushFilter,
  parseStatusParam,
  sanitizeSearchText,
} from "@/lib/human-polish/admin-utils"
import {
  ADMIN_DETAIL_SELECT,
  ADMIN_FILE_SELECT,
  ADMIN_LIST_SELECT,
  type HumanPolishAdminDetailRow,
  type HumanPolishAdminFileRow,
  type HumanPolishAdminListRow,
} from "@/lib/human-polish/admin-types"

export type AdminListFilters = {
  q?: string
  status?: string
  family?: string
  package?: string
  paymentStatus?: string
  rush?: string
  page?: string
}

export type AdminListResult =
  | {
      ok: true
      rows: HumanPolishAdminListRow[]
      total: number
      page: number
      pageSize: number
    }
  | { ok: false; error: string }

export async function listHumanPolishAdminRequests(
  supabase: SupabaseClient,
  filters: AdminListFilters
): Promise<AdminListResult> {
  const pageRaw = Number.parseInt(filters.page || "1", 10)
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const from = (page - 1) * ADMIN_LIST_PAGE_SIZE
  const to = from + ADMIN_LIST_PAGE_SIZE - 1

  const q = sanitizeSearchText(filters.q)
  const status = parseStatusParam(filters.status)
  const family = parseFamilyParam(filters.family)
  const pkg = parsePackageParam(filters.package)
  const paymentStatus = parsePaymentStatusParam(filters.paymentStatus)
  const rush = parseRushFilter(filters.rush)

  let query = supabase
    .from("human_polish_requests")
    .select(ADMIN_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status) query = query.eq("status", status)
  if (family) query = query.eq("family", family)
  if (pkg) query = query.eq("requested_package", pkg)
  if (paymentStatus) query = query.eq("payment_status", paymentStatus)
  if (rush === "requested") query = query.eq("rush_requested", true)
  if (rush === "approved") query = query.eq("rush_approved", true)
  if (rush === "none") {
    query = query.eq("rush_requested", false).eq("rush_approved", false)
  }

  if (q.length > 0) {
    if (isUuid(q)) {
      query = query.eq("id", q)
    } else {
      const safe = q.replace(/[%_,()]/g, "")
      if (safe.length > 0) {
        const pattern = `%${safe}%`
        query = query.or(
          `contact_name.ilike.${pattern},company_name.ilike.${pattern},contact_email.ilike.${pattern}`
        )
      }
    }
  }

  const { data, error, count } = await query

  if (error) {
    console.error("[human-polish/admin] list failed", error.code || "db_error")
    return { ok: false, error: "Unable to load Human Polish requests." }
  }

  return {
    ok: true,
    rows: (data as unknown as HumanPolishAdminListRow[]) || [],
    total: count ?? 0,
    page,
    pageSize: ADMIN_LIST_PAGE_SIZE,
  }
}

export type AdminDetailResult =
  | {
      ok: true
      request: HumanPolishAdminDetailRow
      files: HumanPolishAdminFileRow[]
    }
  | { ok: false; error: string; notFound?: boolean }

export async function getHumanPolishAdminRequest(
  supabase: SupabaseClient,
  requestId: string
): Promise<AdminDetailResult> {
  if (!isUuid(requestId)) {
    return { ok: false, error: "Invalid request id.", notFound: true }
  }

  const { data: request, error } = await supabase
    .from("human_polish_requests")
    .select(ADMIN_DETAIL_SELECT)
    .eq("id", requestId)
    .maybeSingle()

  if (error) {
    console.error("[human-polish/admin] detail failed", error.code || "db_error")
    return { ok: false, error: "Unable to load this request." }
  }

  if (!request) {
    return { ok: false, error: "Request not found.", notFound: true }
  }

  const { data: files, error: filesError } = await supabase
    .from("human_polish_files")
    .select(ADMIN_FILE_SELECT)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })

  if (filesError) {
    console.error("[human-polish/admin] files failed", filesError.code || "db_error")
    return { ok: false, error: "Unable to load request files." }
  }

  return {
    ok: true,
    request: request as unknown as HumanPolishAdminDetailRow,
    files: (files as unknown as HumanPolishAdminFileRow[]) || [],
  }
}
