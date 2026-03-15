"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveRenderToProject } from "@/app/studio/projects/actions"
import type { ProjectType } from "@/lib/projects/types"

export interface SaveToProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectType: ProjectType
  imageUrl: string
  sourceImageUrl?: string | null
  onSuccess?: (projectId: string, renderId: string, projectName: string) => void
}

export function SaveToProjectDialog({
  open,
  onOpenChange,
  projectType,
  imageUrl,
  sourceImageUrl,
  onSuccess,
}: SaveToProjectDialogProps) {
  const [projectName, setProjectName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await saveRenderToProject(
        projectName.trim() || "Untitled Project",
        projectType,
        imageUrl,
        sourceImageUrl
      )
      if ("error" in result) {
        setError(result.error)
        return
      }
      if ("projectId" in result) {
        onSuccess?.(result.projectId, result.renderId, projectName.trim() || "Untitled Project")
        setProjectName("")
        onOpenChange(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Kitchen Remodel - Smith"
              className="mt-1.5"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
