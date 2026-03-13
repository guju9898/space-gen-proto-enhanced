"use client"

import Image from "next/image"
import Link from "next/link"
import { MoreHorizontal, Pencil, Download, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Project } from "@/lib/projects/types"
import { formatProjectType, formatRelativeDate } from "@/lib/projects/utils"

export interface ProjectCardProps {
  project: Project
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
  onDownloadLatest: (project: Project) => void
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop"

export function ProjectCard({ project, onRename, onDelete, onDownloadLatest }: ProjectCardProps) {
  const coverUrl = project.coverImageUrl || DEFAULT_COVER

  return (
    <article className="group rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/studio/projects/${project.id}`} className="block">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <Image
            src={coverUrl}
            alt={project.name}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link href={`/studio/projects/${project.id}`}>
              <h3 className="font-medium text-foreground truncate hover:underline">{project.name}</h3>
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                {formatProjectType(project.projectType)}
              </span>
              <span>
                {project.renderCount} render{project.renderCount !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span>{formatRelativeDate(project.updatedAt)}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/studio/projects/${project.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(project)}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadLatest(project)}>
                <Download className="h-4 w-4 mr-2" />
                Download latest
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(project)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}
