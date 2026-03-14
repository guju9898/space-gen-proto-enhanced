/**
 * Fetch a shared project by its public slug (for /view/[slug]).
 * Uses Supabase server client. RLS must allow reading projects where is_shared = true.
 * Returns types from types/share-project for the client presentation page.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { SharedProjectWithRenders, SharedProject, SharedProjectRender, ContractorInfo } from "@/types/share-project"

function mapRowToSharedProject(row: Record<string, unknown>): SharedProject {
  const contractor: ContractorInfo | null =
    row.contractor_name != null ||
    row.contractor_company != null ||
    row.contractor_phone != null ||
    row.contractor_email != null ||
    row.contractor_website != null
      ? {
          name: row.contractor_name != null ? String(row.contractor_name) : null,
          company: row.contractor_company != null ? String(row.contractor_company) : null,
          phone: row.contractor_phone != null ? String(row.contractor_phone) : null,
          email: row.contractor_email != null ? String(row.contractor_email) : null,
          website: row.contractor_website != null ? String(row.contractor_website) : null,
        }
      : null

  return {
    id: String(row.id),
    name: String(row.name),
    address: row.address != null ? String(row.address) : null,
    contractor,
    visionText: row.vision_text != null ? String(row.vision_text) : null,
    designFeatures: (() => {
      const raw = row.design_features
      if (raw == null) return null
      if (Array.isArray(raw)) return raw.every((x) => typeof x === "string") ? (raw as string[]) : null
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw) as unknown
          return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? parsed : null
        } catch {
          return null
        }
      }
      return null
    })(),
  }
}

function mapRowToSharedRender(row: Record<string, unknown>): SharedProjectRender {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    imageUrl: String(row.image_url),
    thumbnailUrl: row.thumbnail_url != null ? String(row.thumbnail_url) : null,
    sourceImageUrl: row.source_image_url != null ? String(row.source_image_url) : null,
    promptSummary: row.prompt_summary != null ? String(row.prompt_summary) : null,
    createdAt: String(row.created_at),
  }
}

export async function getSharedProjectWithRenders(
  slug: string
): Promise<SharedProjectWithRenders | null> {
  const supabase = await createSupabaseServerClient()

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("share_slug", slug)
    .eq("is_shared", true)
    .single()

  if (projectError || !projectRow) return null

  const project = mapRowToSharedProject(projectRow as Record<string, unknown>)

  const { data: renderRows, error: rendersError } = await supabase
    .from("project_renders")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true })

  if (rendersError) return { project, renders: [] }

  const renders = (renderRows ?? []).map((r) => mapRowToSharedRender(r as Record<string, unknown>))
  return { project, renders }
}
