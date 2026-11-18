import type { SupabaseClient } from "@supabase/supabase-js"
import type { Project, ProjectRender, ProjectType } from "@/lib/projects/types"

export type OwnedProjectPayload = {
  project: Project
  renders: ProjectRender[]
}

/**
 * Load a project the signed-in user owns, plus its versions (newest first).
 * Returns null when missing or not owned — callers show NotFound.
 */
export async function loadOwnedProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<OwnedProjectPayload | null> {
  const { data: row } = await supabase
    .from("projects")
    .select("id, user_id, name, project_type, cover_image, share_slug, is_shared, presenting_on, created_at, updated_at")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!row) return null

  const { data: renderRows } = await supabase
    .from("project_renders")
    .select(
      "id, project_id, user_id, studio_type, image_url, thumbnail_url, source_image_url, prompt_summary, credits_used, created_at"
    )
    .eq("project_id", row.id)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const renders: ProjectRender[] = (renderRows ?? []).map((r) => ({
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    studioType: r.studio_type as ProjectType,
    imageUrl: r.image_url,
    thumbnailUrl: r.thumbnail_url ?? null,
    sourceImageUrl: r.source_image_url ?? null,
    promptSummary: r.prompt_summary ?? null,
    creditsUsed: r.credits_used ?? null,
    createdAt: r.created_at,
  }))

  return {
    project: {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      projectType: row.project_type as ProjectType,
      coverImageUrl: row.cover_image ?? null,
      renderCount: renders.length,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      shareSlug: row.share_slug ?? null,
      isShared: Boolean(row.is_shared),
      presentingOn: row.presenting_on ?? null,
    },
    renders,
  }
}
