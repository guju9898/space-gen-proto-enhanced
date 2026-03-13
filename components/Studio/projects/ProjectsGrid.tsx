"use client"

import type { Project } from "@/lib/projects/types"
import { ProjectCard } from "./ProjectCard"

export interface ProjectsGridProps {
  projects: Project[]
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
  onDownloadLatest: (project: Project) => void
}

export function ProjectsGrid({
  projects,
  onRename,
  onDelete,
  onDownloadLatest,
}: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onRename={onRename}
          onDelete={onDelete}
          onDownloadLatest={onDownloadLatest}
        />
      ))}
    </div>
  )
}
