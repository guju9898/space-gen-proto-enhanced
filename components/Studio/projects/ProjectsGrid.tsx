"use client"

import Link from "next/link"
import type { Project } from "@/lib/projects/types"
import { presentingLabel } from "@/lib/projects/presenting"

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
      {projects.map((project) => {
        const presenting = presentingLabel(project.presentingOn ?? null)
        return (
          <div
            key={project.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <Link
              href={`/studio/projects/${project.id}`}
              className="mb-3 block aspect-[4/3] overflow-hidden rounded bg-muted"
              aria-label={`Open ${project.name}`}
              tabIndex={-1}
            >
              {project.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </Link>
            <h3 className="font-medium text-foreground truncate">
              <Link href={`/studio/projects/${project.id}`} className="hover:underline">
                {project.name}
              </Link>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {project.renderCount} render{project.renderCount !== 1 ? "s" : ""}
            </p>
            {presenting && (
              <p className="mt-1 text-xs font-medium text-primary">{presenting}</p>
            )}
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
        )
      })}
    </div>
  )
}
