/**
 * GET /api/cron/content-renders
 *
 * Daily content renders for marketing (15-20 concept images every morning).
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
 * Fail-closed without CRON_SECRET. See lib/content/run.ts.
 */

import { NextResponse } from "next/server"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import { runContentRenders } from "@/lib/content/run"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || !secret.trim()) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  const summary = await runContentRenders(supabase)
  console.log("[content-renders]", JSON.stringify(summary))
  return NextResponse.json(summary)
}
