import { createHash, randomBytes } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { keepImage } from "@/lib/storage/keepImage"

/**
 * Auto-save for Studio v2 (spec Phase 2): every render goes into the current job's
 * project. The first render of a job creates the project; later ones add versions.
 * Uses the signed-in user's client, so the owner RLS policies apply.
 */

export type StudioType = "interior" | "exterior" | "landscape"

const STUDIO_LABEL: Record<StudioType, string> = {
  landscape: "Landscape concept",
  exterior: "Exterior concept",
  interior: "Interior concept",
}

/** "Landscape concept · Nov 12" in the user's own time zone (sent by the browser). */
export function defaultJobName(studio: StudioType, now: Date, timeZone?: string): string {
  let day: string
  try {
    day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone }).format(now)
  } catch {
    day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(now)
  }
  return `${STUDIO_LABEL[studio]} · ${day}`
}

export function projectImagePath(userId: string, now = Date.now()): string {
  const key = createHash("sha256").update(userId).digest("hex").slice(0, 16)
  return `projects/${key}/${now}-${randomBytes(4).toString("hex")}.png`
}

export interface AutosaveInput {
  userId: string
  studioType: StudioType
  imageUrl: string
  sourceImageUrl?: string | null
  /** Add to this project if it is the user's; otherwise a new one is made. */
  projectId?: string | null
  projectName?: string | null
  timeZone?: string
}

export type AutosaveResult =
  | { projectId: string; projectName: string; renderId: string; imageUrl: string; versions: number }
  | { error: string }

export async function autosaveRender(
  supabase: SupabaseClient,
  input: AutosaveInput,
  keep: (url: string, path: string) => Promise<string | null> = keepImage
): Promise<AutosaveResult> {
  const stored = await keep(input.imageUrl, projectImagePath(input.userId))
  if (!stored) return { error: "Could not store the render" }

  let projectId: string | null = null
  let projectName = ""
  if (input.projectId) {
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", input.projectId)
      .eq("user_id", input.userId)
      .maybeSingle()
    if (data) {
      projectId = data.id as string
      projectName = (data.name as string) ?? ""
    }
  }

  if (!projectId) {
    projectName = input.projectName?.trim().slice(0, 120) || defaultJobName(input.studioType, new Date(), input.timeZone)
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: input.userId, name: projectName, project_type: input.studioType, cover_image: stored })
      .select("id")
      .single()
    if (error || !data) return { error: error?.message ?? "Could not create the project" }
    projectId = data.id as string
  } else {
    await supabase
      .from("projects")
      .update({ cover_image: stored, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("user_id", input.userId)
  }

  const { data: render, error: renderError } = await supabase
    .from("project_renders")
    .insert({
      project_id: projectId,
      user_id: input.userId,
      studio_type: input.studioType,
      image_url: stored,
      source_image_url: input.sourceImageUrl && /^https:\/\//.test(input.sourceImageUrl) ? input.sourceImageUrl : null,
    })
    .select("id")
    .single()
  if (renderError || !render) return { error: renderError?.message ?? "Could not save the render" }

  const { count } = await supabase
    .from("project_renders")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)

  return { projectId, projectName, renderId: render.id as string, imageUrl: stored, versions: count ?? 1 }
}
