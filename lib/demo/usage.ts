import { createClient, SupabaseClient } from "@supabase/supabase-js"

export const DEMO_LIMIT = 5
export const COOKIE_NAME = "renderspace_demo_id"
export const DEMO_EMAIL_COOKIE = "renderspace_demo_email"

export function getDemoSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return null
}

export function getCookieId(request: Request): string | null {
  const cookie = request.headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1].trim()) : null
}

export function isValidDemoEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Check if any of email / IP / cookie has reached DEMO_LIMIT. Returns true if allowed. */
export async function checkDemoLimit(
  supabase: SupabaseClient,
  email: string,
  ip: string | null,
  cookieId: string | null
): Promise<{ allowed: boolean }> {
  const emailTrimmed = email.trim().toLowerCase()

  const { data: byEmail } = await supabase
    .from("demo_usage")
    .select("renders_used")
    .eq("email", emailTrimmed)
  if (byEmail?.some((r) => (r.renders_used ?? 0) >= DEMO_LIMIT)) return { allowed: false }

  if (ip) {
    const { data: byIp } = await supabase
      .from("demo_usage")
      .select("renders_used")
      .eq("ip_address", ip)
    if (byIp?.some((r) => (r.renders_used ?? 0) >= DEMO_LIMIT)) return { allowed: false }
  }

  if (cookieId) {
    const { data: byCookie } = await supabase
      .from("demo_usage")
      .select("renders_used")
      .eq("cookie_id", cookieId)
    if (byCookie?.some((r) => (r.renders_used ?? 0) >= DEMO_LIMIT)) return { allowed: false }
  }

  return { allowed: true }
}

/** Increment demo usage and return new renders_used. */
export async function incrementDemoUsage(
  supabase: SupabaseClient,
  email: string,
  ip: string | null,
  cookieId: string | null
): Promise<number> {
  const emailTrimmed = email.trim().toLowerCase()
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
  return newRendersUsed
}
