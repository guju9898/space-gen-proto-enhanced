import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isString, isObject } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

const DEMO_LIMIT = 5
const COOKIE_NAME = "renderspace_demo_id"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return null
}

function getCookieId(request: Request): string | null {
  const cookie = request.headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1].trim()) : null
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** GET: return current demo usage (renders remaining) for the current visitor. */
export async function GET(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 }
      )
    }

    const ip = getClientIp(request)
    const cookieId = getCookieId(request)
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get("email")?.trim().toLowerCase()

    const orParts: string[] = []
    if (emailParam) orParts.push(`email.eq.${emailParam}`)
    if (ip) orParts.push(`ip_address.eq.${ip}`)
    if (cookieId) orParts.push(`cookie_id.eq.${cookieId}`)

    if (orParts.length === 0) {
      return NextResponse.json({ rendersRemaining: DEMO_LIMIT, rendersUsed: 0 })
    }

    const { data: rows } = await supabase
      .from("demo_usage")
      .select("renders_used")
      .or(orParts.join(","))

    const maxUsed =
      rows && rows.length > 0
        ? Math.max(...rows.map((r) => r.renders_used ?? 0))
        : 0
    const rendersRemaining = Math.max(0, DEMO_LIMIT - maxUsed)

    return NextResponse.json({
      rendersRemaining,
      rendersUsed: maxUsed,
    })
  } catch (err) {
    console.error("Demo usage check error:", err)
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 }
      )
    }

    const ip = getClientIp(request)
    const cookieId = getCookieId(request)

    const body = await request.json().catch(() => null) as unknown
    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { email, image, prompt } = body as { email?: unknown; image?: unknown; prompt?: unknown }
    if (!isString(email) || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    const emailTrimmed = email.trim().toLowerCase()

    // Check limits: any of email / IP / cookie at or over DEMO_LIMIT → block
    const { data: byEmail } = await supabase
      .from("demo_usage")
      .select("id, renders_used")
      .eq("email", emailTrimmed)

    if (byEmail?.some((r) => r.renders_used >= DEMO_LIMIT)) {
      return NextResponse.json(
        { error: "Demo limit reached" },
        { status: 429 }
      )
    }

    if (ip) {
      const { data: byIp } = await supabase
        .from("demo_usage")
        .select("id, renders_used")
        .eq("ip_address", ip)
      if (byIp?.some((r) => r.renders_used >= DEMO_LIMIT)) {
        return NextResponse.json(
          { error: "Demo limit reached" },
          { status: 429 }
        )
      }
    }

    if (cookieId) {
      const { data: byCookie } = await supabase
        .from("demo_usage")
        .select("id, renders_used")
        .eq("cookie_id", cookieId)
      if (byCookie?.some((r) => r.renders_used >= DEMO_LIMIT)) {
        return NextResponse.json(
          { error: "Demo limit reached" },
          { status: 429 }
        )
      }
    }

    const imageInput = isString(image) && (image.startsWith("data:image/") || image.startsWith("http"))
      ? image
      : undefined
    const promptText = isString(prompt) ? prompt.trim() : "Modern interior design, photorealistic"

    const origin = request.headers.get("x-forwarded-host")
      ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
      : new URL(request.url).origin

    const genRes = await fetch(`${origin}/api/generate-interior`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptText,
        image: imageInput,
      }),
    })

    if (!genRes.ok) {
      const err = await genRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as { error?: string }).error ?? "Failed to generate render" },
        { status: genRes.status >= 400 ? genRes.status : 500 }
      )
    }

    const genData = (await genRes.json()) as { imageUrl?: string }
    const imageUrl = genData?.imageUrl
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate render" },
        { status: 500 }
      )
    }

    // Find or create row to increment (prefer email, then cookie, then ip)
    const orParts = [`email.eq.${emailTrimmed}`]
    if (ip) orParts.push(`ip_address.eq.${ip}`)
    if (cookieId) orParts.push(`cookie_id.eq.${cookieId}`)

    const { data: rows } = await supabase
      .from("demo_usage")
      .select("id, renders_used")
      .or(orParts.join(","))
      .limit(1)

    const existing = rows?.[0]
    let newRendersUsed: number
    if (existing) {
      newRendersUsed = (existing.renders_used ?? 0) + 1
      await supabase
        .from("demo_usage")
        .update({
          renders_used: newRendersUsed,
          email: emailTrimmed,
          ...(ip && { ip_address: ip }),
          ...(cookieId && { cookie_id: cookieId }),
        })
        .eq("id", existing.id)
    } else {
      newRendersUsed = 1
      await supabase.from("demo_usage").insert({
        email: emailTrimmed,
        ip_address: ip ?? null,
        cookie_id: cookieId ?? null,
        renders_used: 1,
      })
    }

    const rendersRemaining = Math.max(0, DEMO_LIMIT - newRendersUsed)

    return NextResponse.json({
      imageUrl,
      rendersRemaining,
      rendersUsed: newRendersUsed,
    })
  } catch (err) {
    console.error("Demo render error:", err)
    return NextResponse.json(
      { error: "Failed to process demo render" },
      { status: 500 }
    )
  }
}
