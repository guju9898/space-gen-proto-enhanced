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
  /** Future: shareable slug for renderspace.ai/view/[shareSlug] */
  shareSlug?: string | null
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
  createdAt: string
}

export type SortOption = "updated_desc" | "created_desc" | "created_asc"

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  interior: "Interior",
  exterior: "Exterior",
  landscape: "Landscape",
}
