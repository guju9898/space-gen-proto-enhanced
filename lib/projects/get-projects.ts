/**
 * Data access for My Projects — real `projects` / `project_renders` rows (owner RLS).
 */

import { createClient } from "@/lib/supabase/client"
import type { Project, ProjectType, SortOption } from "./types"

export interface GetProjectsOptions {
  userId: string
  search?: string
  projectType?: string | null
  sort?: SortOption
}

type ProjectRow = {
  id: string
  user_id: string
  name: string
  project_type: string
  cover_image: string | null
  share_slug: string | null
  is_shared: boolean | null
  presenting_on?: string | null
  created_at: string
  updated_at: string
  project_renders?: { count: number }[] | null
}

function mapRow(row: ProjectRow): Project {
  const count = Array.isArray(row.project_renders) ? Number(row.project_renders[0]?.count ?? 0) : 0
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    projectType: row.project_type as ProjectType,
    coverImageUrl: row.cover_image,
    renderCount: Number.isFinite(count) ? count : 0,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    shareSlug: row.share_slug,
    isShared: Boolean(row.is_shared),
    presentingOn: row.presenting_on ?? null,
  }
}

/**
 * Fetch projects for the signed-in user via the browser Supabase client (RLS).
 */
export async function getProjects(options: GetProjectsOptions): Promise<Project[]> {
  const { userId, search = "", projectType, sort = "updated_desc" } = options
  const supabase = createClient()

  let query = supabase
    .from("projects")
    .select("id, user_id, name, project_type, cover_image, share_slug, is_shared, presenting_on, created_at, updated_at, project_renders(count)")
    .eq("user_id", userId)

  if (projectType && projectType !== "all") {
    query = query.eq("project_type", projectType)
  }

  if (search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`)
  }

  if (sort === "updated_desc") query = query.order("updated_at", { ascending: false })
  else if (sort === "created_desc") query = query.order("created_at", { ascending: false })
  else if (sort === "created_asc") query = query.order("created_at", { ascending: true })

  const { data, error } = await query
  if (error) {
    console.error("getProjects failed", error.message)
    return []
  }
  return ((data || []) as ProjectRow[]).map(mapRow)
}
