/**
 * Data access for My Projects (browser). Reads the signed-in user's own rows; the
 * owner RLS policies on projects and project_renders enforce that too.
 */

import { createClient } from "@/lib/supabase/client"
import type { Project, ProjectRender, ProjectType, SortOption } from "./types"

export interface GetProjectsOptions {
  userId: string
  search?: string
  projectType?: string | null
  sort?: SortOption
}

type ProjectRow = {
  id: string
  user_id: string
  name: string | null
  project_type: string | null
  cover_image: string | null
  share_slug: string | null
  is_shared: boolean | null
  created_at: string
  updated_at: string | null
  project_renders?: { count: number }[] | null
}

const TYPES: ProjectType[] = ["interior", "exterior", "landscape"]

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name?.trim() || "Untitled project",
    projectType: TYPES.includes(row.project_type as ProjectType) ? (row.project_type as ProjectType) : "exterior",
    coverImageUrl: row.cover_image ?? null,
    renderCount: row.project_renders?.[0]?.count ?? 0,
    updatedAt: row.updated_at ?? row.created_at,
    createdAt: row.created_at,
    shareSlug: row.share_slug ?? null,
    isShared: Boolean(row.is_shared),
  }
}

/** Escapes % and _ so a search for "50%" isn't a wildcard. */
export function likePattern(search: string): string {
  return `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

export async function getProjects(options: GetProjectsOptions): Promise<Project[]> {
  const { userId, search = "", projectType, sort = "updated_desc" } = options
  const supabase = createClient()
  let query = supabase
    .from("projects")
    .select("id, user_id, name, project_type, cover_image, share_slug, is_shared, created_at, updated_at, project_renders(count)")
    .eq("user_id", userId)

  if (search.trim()) query = query.ilike("name", likePattern(search))
  if (projectType && projectType !== "all") query = query.eq("project_type", projectType)

  if (sort === "created_desc") query = query.order("created_at", { ascending: false })
  else if (sort === "created_asc") query = query.order("created_at", { ascending: true })
  else query = query.order("updated_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })

  const { data, error } = await query.limit(200)
  if (error) {
    console.error("getProjects failed", error.message)
    throw new Error("Couldn't load your projects. Refresh to try again.")
  }
  return ((data ?? []) as ProjectRow[]).map(mapProjectRow)
}

type RenderRow = {
  id: string
  project_id: string
  user_id: string
  studio_type: string | null
  image_url: string
  thumbnail_url: string | null
  source_image_url: string | null
  prompt_summary: string | null
  credits_used: number | string | null
  created_at: string
}

export function mapRenderRow(row: RenderRow): ProjectRender {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    studioType: TYPES.includes(row.studio_type as ProjectType) ? (row.studio_type as ProjectType) : "exterior",
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    sourceImageUrl: row.source_image_url,
    promptSummary: row.prompt_summary,
    creditsUsed: row.credits_used == null ? null : Number(row.credits_used),
    createdAt: row.created_at,
  }
}

/** One project with its renders, newest first. Null if it isn't this user's. */
export async function getProjectWithRenders(projectId: string): Promise<{ project: Project; renders: ProjectRender[] } | null> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from("projects")
    .select("id, user_id, name, project_type, cover_image, share_slug, is_shared, created_at, updated_at, project_renders(count)")
    .eq("id", projectId)
    .maybeSingle()
  if (error || !row) return null
  const { data: renders } = await supabase
    .from("project_renders")
    .select("id, project_id, user_id, studio_type, image_url, thumbnail_url, source_image_url, prompt_summary, credits_used, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
  return { project: mapProjectRow(row as ProjectRow), renders: ((renders ?? []) as RenderRow[]).map(mapRenderRow) }
}
