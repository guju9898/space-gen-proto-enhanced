"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useImageDrop } from "@/hooks/useImageDrop"

/**
 * Dashed upload box that also accepts a dropped photo. A component (not a hook in
 * the page) because the Studio pages return early before their form renders.
 */
export function PhotoDropArea({
  onFile,
  isUploading,
  children,
}: {
  onFile: (file: File, previewUrl: string) => void
  isUploading: boolean
  children: ReactNode
}) {
  const { isDragging, dropProps } = useImageDrop(onFile, isUploading)
  return (
    <div
      {...dropProps}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isUploading
          ? "cursor-wait opacity-70 border-muted"
          : isDragging
            ? "border-primary bg-primary/5"
            : "hover:border-muted-foreground/50 border-border"
      )}
    >
      {children}
    </div>
  )
}
