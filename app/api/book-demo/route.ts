import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const DEFAULT_TABLE = "book_demo_leads"

type BookDemoBody = {
  fullName?: string
  email?: string
  phone?: string
  company?: string
  monthlyRevenue?: string
  /** e.g. "contractor-demo" when passed from query string */
  source?: string
  citySlug?: string
}

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0
}

function inferFromReferer(referer: string | null, body: BookDemoBody) {
  let source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "direct"
  let citySlug =
    typeof body.citySlug === "string" && body.citySlug.trim() ? body.citySlug.trim().toLowerCase() : null

  if (referer && referer.includes("contractor-demo")) {
    if (source === "direct") source = "contractor-demo"
    if (!citySlug) {
      try {
        const u = new URL(referer)
        const parts = u.pathname.split("/").filter(Boolean)
        const idx = parts.indexOf("contractor-demo")
        if (idx >= 0 && parts[idx + 1]) {
          citySlug = decodeURIComponent(parts[idx + 1]).toLowerCase()
        }
      } catch {
        /* ignore */
      }
    }
  }

  return { source, city_slug: citySlug }
}

export async function POST(request: Request) {
  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Server is not configured for lead capture." }, { status: 503 })
  }

  let body: BookDemoBody
  try {
    body = (await request.json()) as BookDemoBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!isNonEmpty(body.fullName) || !isNonEmpty(body.email) || !isNonEmpty(body.phone)) {
    return NextResponse.json({ error: "Full name, email, and phone are required." }, { status: 400 })
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  if (!emailOk) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
  }

  const referer = request.headers.get("referer")
  const { source, city_slug } = inferFromReferer(referer, body)

  const companyName = body.company?.trim() ?? ""
  const revenue = body.monthlyRevenue?.trim() ?? ""

  const row = {
    full_name: body.fullName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
    company_name: companyName.length > 0 ? companyName : null,
    revenue: revenue.length > 0 ? revenue : null,
    source,
    city_slug,
  }

  const table = process.env.SUPABASE_BOOK_DEMO_TABLE?.trim() || DEFAULT_TABLE

  const { error } = await supabase.from(table).insert(row)

  if (error) {
    console.error("[book-demo] Supabase insert failed:", error)
    return NextResponse.json(
      { error: "We couldn’t save your details. Please try again in a moment." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
