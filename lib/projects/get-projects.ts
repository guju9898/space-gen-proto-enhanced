/**
 * Data access for projects.
 * V1: uses mock data. Swap to Supabase when tables exist.
 */

import type { Project, SortOption } from "./types"
import { getMockProjects } from "./mock-data"

export interface GetProjectsOptions {
  userId: string
  search?: string
  projectType?: string | null
  sort?: SortOption
}

/**
 * Fetch projects for the current user.
 * TODO: Replace with Supabase query when projects table exists.
 */
export async function getProjects(options: GetProjectsOptions): Promise<Project[]> {
  const { userId, search = "", projectType, sort = "updated_desc" } = options
  let projects = getMockProjects(userId)

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    projects = projects.filter((p) => p.name.toLowerCase().includes(q))
  }

  if (projectType && projectType !== "all") {
    projects = projects.filter((p) => p.projectType === projectType)
  }

  const sorted = [...projects].sort((a, b) => {
    if (sort === "updated_desc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    if (sort === "created_desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sort === "created_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return 0
  })

  return sorted
}
