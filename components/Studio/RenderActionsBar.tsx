"use client"

import { Download, FolderPlus, Share2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ProjectType } from "@/lib/projects/types"

export interface RenderActionsBarProps {
  /** Current render image URL; when null, actions may be disabled */
  currentRenderUrl: string | null
  projectType: ProjectType
  /** Whether user has saved this session to a project (enables Share / Create Mockup) */
  hasSavedProject?: boolean
  onDownload: () => void
  onSaveToProject: () => void
  onShareProject: () => void
  onCreateMockup: () => void
  className?: string
}

export function RenderActionsBar({
  currentRenderUrl,
  projectType,
  hasSavedProject,
  onDownload,
  onSaveToProject,
  onShareProject,
  onCreateMockup,
  className,
}: RenderActionsBarProps) {
  const hasRender = !!currentRenderUrl

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasRender}
        onClick={onDownload}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasRender}
        onClick={onSaveToProject}
        className="gap-2"
      >
        <FolderPlus className="h-4 w-4" />
        Save to Project
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasSavedProject}
        onClick={onShareProject}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share Project
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasSavedProject}
        onClick={onCreateMockup}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Create Prospect Mockup
      </Button>
    </div>
  )
}
