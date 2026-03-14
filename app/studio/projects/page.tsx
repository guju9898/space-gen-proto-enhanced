"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlobalHeader } from "@/components/Studio/GlobalHeader"
import { ProjectsHeader } from "@/components/Studio/projects/ProjectsHeader"
import { ProjectsToolbar } from "@/components/Studio/projects/ProjectsToolbar"
import { ProjectsGrid } from "@/components/Studio/projects/ProjectsGrid"
import { ProjectsEmptyState } from "@/components/Studio/projects/ProjectsEmptyState"
import { ProjectsSkeleton } from "@/components/Studio/projects/ProjectsSkeleton"
import { RenameProjectDialog } from "@/components/Studio/projects/RenameProjectDialog"
import { DeleteProjectDialog } from "@/components/Studio/projects/DeleteProjectDialog"
import { ShareProjectDialog } from "@/components/Studio/projects/ShareProjectDialog"
import { getProjects } from "@/lib/projects/get-projects"
import { downloadImage } from "@/lib/projects/utils"
import { renameProject, deleteProject, toggleProjectShare } from "@/app/studio/projects/actions"
import type { Project, SortOption } from "@/lib/projects/types"

export default function StudioProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [projectTypeFilter, setProjectTypeFilter] = useState("all")
  const [sort, setSort] = useState<SortOption>("updated_desc")
  const [renameProjectState, setRenameProjectState] = useState<Project | null>(null)
  const [deleteProjectState, setDeleteProjectState] = useState<Project | null>(null)
  const [shareProject, setShareProject] = useState<Project | null>(null)

  const loadProjects = useCallback(
    async (uid: string) => {
      setLoading(true)
      try {
        const list = await getProjects({
          userId: uid,
          search,
          projectType: projectTypeFilter === "all" ? undefined : projectTypeFilter,
          sort,
        })
        setProjects(list)
      } finally {
        setLoading(false)
      }
    },
    [search, projectTypeFilter, sort]
  )

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await loadProjects(user.id)
      } else {
        setLoading(false)
      }
    }
    run()
  }, [loadProjects])

  useEffect(() => {
    if (userId && !loading) loadProjects(userId)
  }, [userId, search, projectTypeFilter, sort])

  async function handleRename(projectId: string, newName: string) {
    const result = await renameProject(projectId, newName)
    if (result.error) throw new Error(result.error)
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
      )
    )
    setRenameProjectState(null)
  }

  async function handleDelete(projectId: string) {
    const result = await deleteProject(projectId)
    if (result.error) throw new Error(result.error)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    setDeleteProjectState(null)
  }

  async function handleToggleShare(projectId: string) {
    const result = await toggleProjectShare(projectId)
    if (result.error) return result
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, shareSlug: result.shareSlug ?? p.shareSlug, isShared: result.isShared ?? p.isShared }
          : p
      )
    )
    return result
  }

  function handleDownloadLatest(project: Project) {
    const url =
      project.coverImageUrl ||
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop"
    const filename = `${project.name.replace(/[^a-z0-9-_]/gi, "_")}.png`
    downloadImage(url, filename)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GlobalHeader />
      <main className="flex-1 container mx-auto px-6 py-8">
        <ProjectsHeader />
        <ProjectsToolbar
          search={search}
          onSearchChange={setSearch}
          projectTypeFilter={projectTypeFilter}
          onProjectTypeFilterChange={setProjectTypeFilter}
          sort={sort}
          onSortChange={setSort}
        />
        {loading ? (
          <ProjectsSkeleton />
        ) : projects.length === 0 ? (
          <ProjectsEmptyState />
        ) : (
          <ProjectsGrid
            projects={projects}
            onRename={setRenameProjectState}
            onDelete={setDeleteProjectState}
            onDownloadLatest={handleDownloadLatest}
            onShare={setShareProject}
          />
        )}
      </main>
      <RenameProjectDialog
        project={renameProjectState}
        open={!!renameProjectState}
        onOpenChange={(open) => !open && setRenameProjectState(null)}
        onRename={handleRename}
      />
      <DeleteProjectDialog
        project={deleteProjectState}
        open={!!deleteProjectState}
        onOpenChange={(open) => !open && setDeleteProjectState(null)}
        onConfirm={handleDelete}
      />
      <ShareProjectDialog
        project={shareProject}
        open={!!shareProject}
        onOpenChange={(open) => !open && setShareProject(null)}
        onToggleShare={handleToggleShare}
      />
    </div>
  )
}
