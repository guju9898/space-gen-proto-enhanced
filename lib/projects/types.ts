/**
 * Project and render types for My Projects.
 * Future-ready for Supabase: projects + project_renders tables.
 */

export type ProjectType = "interior" | "exterior" | "landscape"

export interface Project {
  id: string
  userId: string
  name: string
  projectType: ProjectType
  coverImageUrl: string | null
  renderCount: number
  updatedAt: string
  createdAt: string
  /** Shareable slug for /view/[slug] */
  shareSlug?: string | null
  /** Whether the project is publicly shared */
  isShared?: boolean
}

export interface ProjectRender {
  id: string
  projectId: string
  userId: string
  studioType: ProjectType
  imageUrl: string
  thumbnailUrl: string | null
  sourceImageUrl: string | null
  promptSummary: string | null
  creditsUsed?: number | null
  createdAt: string
}

/**
 * Database column names (Supabase):
 * projects: id, user_id, name, project_type, cover_image, share_slug, is_shared, created_at, updated_at
 * project_renders: id, project_id, user_id, studio_type, image_url, thumbnail_url, source_image_url, prompt_summary, credits_used, created_at
 */

export type SortOption = "updated_desc" | "created_desc" | "created_asc"

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  interior: "Interior",
  exterior: "Exterior",
  landscape: "Landscape",
}
