/**
 * GET /api/cron/human-polish-pack-expiration
 *
 * Daily AI Render Pack ~14-day remaining reminder. Fail-closed without CRON_SECRET.
 */

import { NextResponse } from "next/server"
import {
  AI_RENDER_PACK_EXPIRATION_DAYS,
  HUMAN_POLISH_PACK_EXPIRATION_REMINDER_DAYS,
} from "@/lib/human-polish/config"
import { sendPackExpirationReminderEmail } from "@/lib/human-polish/email"
import {
  daysRemainingUntilPackExpiry,
  formatPackExpiresOnDisplay,
  isPackExpirationReminderEligible,
} from "@/lib/human-polish/pack-expiration"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  isHumanPolishPackage,
} from "@/lib/human-polish/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || !secret.trim()) return false
  const header = request.headers.get("authorization")
  if (!header) return false
  return header === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  const now = Date.now()
  const windowEnd = new Date(
    now + HUMAN_POLISH_PACK_EXPIRATION_REMINDER_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()
  const nowIso = new Date(now).toISOString()

  const { data: candidates, error } = await supabase
    .from("human_polish_requests")
    .select(
      "id, family, payment_status, status, pack_expires_at, expiration_reminder_sent_at, contact_email, contact_name, requested_package, approved_package"
    )
    .eq("family", "ai-render-pack")
    .eq("payment_status", "paid")
    .is("expiration_reminder_sent_at", null)
    .not("pack_expires_at", "is", null)
    .gt("pack_expires_at", nowIso)
    .lte("pack_expires_at", windowEnd)
    .limit(100)

  if (error) {
    console.error("[human-polish/cron] pack expiration candidate query failed")
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  let claimed = 0
  let sent = 0
  let skipped = 0
  let failed = 0

  for (const raw of candidates || []) {
    const row = raw as {
      id: string
      family: string
      payment_status: string
      status: string
      pack_expires_at: string | null
      expiration_reminder_sent_at: string | null
      contact_email: string | null
      contact_name: string | null
      requested_package: string
      approved_package: string | null
    }

    if (
      !isPackExpirationReminderEligible(
        {
          id: row.id,
          family: row.family,
          payment_status: row.payment_status,
          status: row.status,
          pack_expires_at: row.pack_expires_at,
          expiration_reminder_sent_at: row.expiration_reminder_sent_at,
        },
        now
      )
    ) {
      skipped += 1
      continue
    }

    const claimAt = new Date().toISOString()
    const { data: claimedRow, error: claimErr } = await supabase
      .from("human_polish_requests")
      .update({ expiration_reminder_sent_at: claimAt })
      .eq("id", row.id)
      .is("expiration_reminder_sent_at", null)
      .select("id")
      .maybeSingle()

    if (claimErr || !claimedRow) {
      skipped += 1
      continue
    }
    claimed += 1

    const packExpiresAt = row.pack_expires_at!
    const pkg =
      row.approved_package && isHumanPolishPackage(row.approved_package)
        ? row.approved_package
        : isHumanPolishPackage(row.requested_package)
          ? row.requested_package
          : null

    if (!row.contact_email || !pkg) {
      // Keep claim to avoid thrashing without recipient; log sanitized.
      console.error("[human-polish/cron] reminder skipped — missing email or package", {
        requestId: row.id,
        status: row.status,
      })
      failed += 1
      continue
    }

    const mail = await sendPackExpirationReminderEmail({
      to: row.contact_email,
      contactName: row.contact_name || undefined,
      requestId: row.id,
      packageLabel: HUMAN_POLISH_PACKAGE_LABELS[pkg],
      expiresOnFormatted: formatPackExpiresOnDisplay(packExpiresAt),
      daysRemaining: daysRemainingUntilPackExpiry(packExpiresAt, now),
    })

    if (!mail.sent && !mail.skipped) {
      await supabase
        .from("human_polish_requests")
        .update({ expiration_reminder_sent_at: null })
        .eq("id", row.id)
        .eq("expiration_reminder_sent_at", claimAt)
      failed += 1
      console.error("[human-polish/cron] reminder email failed", {
        requestId: row.id,
        status: row.status,
      })
      continue
    }

    if (mail.sent) sent += 1
    else skipped += 1
  }

  return NextResponse.json({
    ok: true,
    packWindowDays: AI_RENDER_PACK_EXPIRATION_DAYS,
    reminderDays: HUMAN_POLISH_PACK_EXPIRATION_REMINDER_DAYS,
    claimed,
    sent,
    skipped,
    failed,
  })
}
