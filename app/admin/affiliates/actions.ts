"use server"

import { revalidatePath } from "next/cache"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import {
  approveAffiliate,
  approveReadyCommissions,
  reverseCommission,
  setAffiliateStatus,
  setProgramStatus,
  transitionPayout,
} from "@/lib/affiliates/service"
import type { ProgramStatus } from "@/lib/affiliates/config"

async function adminClient() {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return null
  return auth.supabase
}

export async function approveAffiliateAction(formData: FormData) {
  const supabase = await adminClient()
  if (!supabase) return
  const accountId = String(formData.get("accountId") ?? "")
  const percent = Number(formData.get("commissionPercent"))
  if (!accountId || !Number.isFinite(percent)) return
  await approveAffiliate({ supabase, accountId, commissionBps: Math.round(percent * 100) })
  revalidatePath("/admin/affiliates")
}

export async function rejectAffiliateAction(formData: FormData) {
  const supabase = await adminClient()
  if (!supabase) return
  const accountId = String(formData.get("accountId") ?? "")
  const status = formData.get("status") === "suspended" ? "suspended" : "rejected"
  await setAffiliateStatus({ supabase, accountId, status })
  revalidatePath("/admin/affiliates")
}

export async function programStatusAction(formData: FormData) {
  const supabase = await adminClient()
  if (!supabase) return
  const status = String(formData.get("status") ?? "")
  if (status !== "draft" && status !== "active" && status !== "paused") return
  await setProgramStatus({ supabase, status: status as ProgramStatus })
  revalidatePath("/admin/affiliates")
}

export async function releaseHeldCommissionsAction() {
  const supabase = await adminClient()
  if (!supabase) return
  await approveReadyCommissions({ supabase })
  revalidatePath("/admin/affiliates")
}

export async function reverseCommissionAction(formData: FormData) {
  const supabase = await adminClient()
  if (!supabase) return
  const commissionId = String(formData.get("commissionId") ?? "")
  await reverseCommission({ supabase, commissionId })
  revalidatePath("/admin/affiliates")
}

export async function payoutAction(formData: FormData) {
  const supabase = await adminClient()
  if (!supabase) return
  const payoutId = String(formData.get("payoutId") ?? "")
  const action = String(formData.get("action") ?? "")
  if (action !== "approve" && action !== "reject" && action !== "mark_paid") return
  await transitionPayout({
    supabase,
    payoutId,
    action,
    externalReference: String(formData.get("reference") ?? ""),
  })
  revalidatePath("/admin/affiliates")
}
