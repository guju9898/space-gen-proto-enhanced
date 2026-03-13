"use client"

import Link from "next/link"
import { FolderOpen, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProjectsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
      <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-medium text-foreground">No projects yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Save your renders into projects to keep job assets organized and easy to reuse for estimates.
      </p>
      <Button asChild className="mt-6">
        <Link href="/studio/interior" className="inline-flex items-center gap-2">
          Go to Studio
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
