import { createHash, randomBytes } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { uploadBase64ToSupabase } from "@/lib/api/uploadBase64ToSupabase"

/**
 * Demo renders that move into the account when a demo user signs up (spec R12).
 *
 * Each successful demo render is recorded in guest_render_claims against the demo
 * browser cookie. When the same browser is signed in, claimGuestRenders() puts the
 * unclaimed renders into one new project. No credits, auth or Stripe involved.
 */

export const GUEST_RENDER_TTL_DAYS = 30
export const DEMO_PROJECT_NAME = "Demo renders"

export type StudioType = "interior" | "exterior" | "landscape"

export interface GuestRenderInput {
  cookieId: string | null
  studioType: StudioType
  imageUrl: string
  sourceImageUrl?: string | null
  settings?: Record<string, unknown>
}

export interface GuestRenderRow {
  id: string
  studio_type: StudioType
  image_url: string
  source_image_url: string | null
  created_at: string
}

/** True for URLs already in this project's public storage (they never expire). */
export function isOwnStorageUrl(url: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""): boolean {
  if (!supabaseUrl) return false
  try {
    const host = new URL(supabaseUrl).host
    const u = new URL(url)
    return u.host === host && u.pathname.startsWith("/storage/v1/object/public/")
  } catch {
    return false
  }
}

/** Storage path for a kept demo render. The cookie id is hashed so it never appears in a public URL. */
export function demoImageStoragePath(cookieId: string, now = Date.now()): string {
  const key = createHash("sha256").update(cookieId).digest("hex").slice(0, 16)
  return `demo/${key}/${now}-${randomBytes(4).toString("hex")}.png`
}

/** Keeps only settings worth storing: short strings, numbers and booleans. Drops images and blobs. */
export function compactSettings(settings: Record<string, unknown> | undefined): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!settings) return out
  for (const [key, value] of Object.entries(settings)) {
    if (key === "image" || key === "imageUrl" || key === "uploadedImage") continue
    if (typeof value === "string") {
      if (value.startsWith("data:") || value.length > 300) continue
      out[key] = value
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value
    }
  }
  return out
}

/**
 * Copies a render into our storage when it would otherwise vanish: data: URLs, and
 * provider URLs (Replicate's expire after about an hour). Returns null if it can't.
 */
export async function persistRenderImage(imageUrl: string, cookieId: string): Promise<string | null> {
  if (isOwnStorageUrl(imageUrl)) return imageUrl
  const path = demoImageStoragePath(cookieId)
  if (imageUrl.startsWith("data:image")) {
    return uploadBase64ToSupabase({ base64DataUrl: imageUrl, filePath: path })
  }
  if (!/^https:\/\//.test(imageUrl)) return null
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.length === 0 || bytes.length > 20 * 1024 * 1024) return null
    return uploadBase64ToSupabase({ base64DataUrl: `data:image/png;base64,${bytes.toString("base64")}`, filePath: path })
  } catch {
    return null
  }
}

/** Records one demo render so it can move into the account later. Never throws. */
export async function recordGuestRender(supabase: SupabaseClient, input: GuestRenderInput): Promise<boolean> {
  try {
    if (!input.cookieId) return false
    const stored = await persistRenderImage(input.imageUrl, input.cookieId)
    if (!stored) return false
    const { error } = await supabase.from("guest_render_claims").insert({
      token_hash: createHash("sha256").update(randomBytes(32)).digest("hex"),
      demo_cookie_id: input.cookieId,
      studio_type: input.studioType,
      image_url: stored,
      source_image_url: input.sourceImageUrl && /^https:\/\//.test(input.sourceImageUrl) ? input.sourceImageUrl : null,
      settings: compactSettings(input.settings),
      expires_at: new Date(Date.now() + GUEST_RENDER_TTL_DAYS * 86_400_000).toISOString(),
    })
    if (error) console.error("guest_render_claims insert failed", error.message)
    return !error
  } catch (e) {
    console.error("recordGuestRender failed", e)
    return false
  }
}

/** The project type for a set of demo renders: the Studio used most, latest wins a tie. */
export function projectTypeFor(rows: Pick<GuestRenderRow, "studio_type">[]): StudioType {
  const counts = new Map<StudioType, number>()
  for (const row of rows) counts.set(row.studio_type, (counts.get(row.studio_type) ?? 0) + 1)
  let best: StudioType = rows.at(-1)?.studio_type ?? "landscape"
  for (const [type, count] of counts) if (count > (counts.get(best) ?? 0)) best = type
  return best
}

export interface ClaimResult {
  claimed: number
  projectId: string | null
}

/**
 * Moves this browser's unclaimed, unexpired demo renders into a new project owned by
 * userId. Uses the service-role client (the claims table has no client policies).
 * Safe to call repeatedly: claimed rows are skipped, and a row is only marked claimed
 * by the update that still sees claimed_by null.
 */
export async function claimGuestRenders(supabase: SupabaseClient, userId: string, cookieId: string | null): Promise<ClaimResult> {
  if (!cookieId) return { claimed: 0, projectId: null }
  const { data, error } = await supabase
    .from("guest_render_claims")
    .select("id, studio_type, image_url, source_image_url, created_at")
    .eq("demo_cookie_id", cookieId)
    .is("claimed_by", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(20)
  if (error || !data?.length) return { claimed: 0, projectId: null }

  // Lock the rows to this user first, so two tabs can't both create a project.
  const ids = (data as GuestRenderRow[]).map((r) => r.id)
  const claimedAt = new Date().toISOString()
  const { data: locked } = await supabase
    .from("guest_render_claims")
    .update({ claimed_by: userId, claimed_at: claimedAt })
    .in("id", ids)
    .is("claimed_by", null)
    .select("id, studio_type, image_url, source_image_url, created_at")
  const rows = ((locked ?? []) as GuestRenderRow[]).sort((a, b) => a.created_at.localeCompare(b.created_at))
  if (!rows.length) return { claimed: 0, projectId: null }

  const type = projectTypeFor(rows)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({ user_id: userId, name: DEMO_PROJECT_NAME, project_type: type, cover_image: rows.at(-1)!.image_url })
    .select("id")
    .single()
  if (projectError || !project) {
    // Release the rows so a later visit can try again.
    await supabase.from("guest_render_claims").update({ claimed_by: null, claimed_at: null }).in("id", rows.map((r) => r.id))
    return { claimed: 0, projectId: null }
  }

  for (const row of rows) {
    const { data: render } = await supabase
      .from("project_renders")
      .insert({
        project_id: project.id,
        user_id: userId,
        studio_type: row.studio_type,
        image_url: row.image_url,
        source_image_url: row.source_image_url,
        prompt_summary: "Demo render",
        credits_used: 0,
      })
      .select("id")
      .single()
    await supabase
      .from("guest_render_claims")
      .update({ project_id: project.id, render_id: render?.id ?? null })
      .eq("id", row.id)
  }
  return { claimed: rows.length, projectId: project.id }
}
