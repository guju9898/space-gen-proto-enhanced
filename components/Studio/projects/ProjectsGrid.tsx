"use client"

import type { Project } from "@/lib/projects/types"

export interface ProjectsGridProps {
  projects: Project[]
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
  onDownloadLatest: (project: Project) => void
  onShare?: (project: Project) => void
}

export function ProjectsGrid({
  projects,
  onRename,
  onDelete,
  onDownloadLatest,
  onShare,
}: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="aspect-[4/3] bg-muted rounded mb-3" />
          <h3 className="font-medium text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {project.renderCount} render{project.renderCount !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {onShare && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => onShare(project)}
              >
                Share
              </button>
            )}
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onRename(project)}
            >
              Rename
            </button>
            <button
              type="button"
              className="text-xs text-destructive hover:underline"
              onClick={() => onDelete(project)}
            >
              Delete
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => onDownloadLatest(project)}
            >
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
