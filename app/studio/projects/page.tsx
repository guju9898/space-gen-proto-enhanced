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
import { getProjects } from "@/lib/projects/get-projects"
import { downloadImage } from "@/lib/projects/utils"
import type { Project, SortOption } from "@/lib/projects/types"

export default function StudioProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [projectTypeFilter, setProjectTypeFilter] = useState("all")
  const [sort, setSort] = useState<SortOption>("updated_desc")
  const [renameProject, setRenameProject] = useState<Project | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)

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
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
      )
    )
    setRenameProject(null)
  }

  async function handleDelete(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    setDeleteProject(null)
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
            onRename={setRenameProject}
            onDelete={setDeleteProject}
            onDownloadLatest={handleDownloadLatest}
          />
        )}
      </main>
      <RenameProjectDialog
        project={renameProject}
        open={!!renameProject}
        onOpenChange={(open) => !open && setRenameProject(null)}
        onRename={handleRename}
      />
      <DeleteProjectDialog
        project={deleteProject}
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
