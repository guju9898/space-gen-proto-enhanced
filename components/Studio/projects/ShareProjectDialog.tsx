"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check } from "lucide-react"
import type { Project } from "@/lib/projects/types"

export interface ShareProjectDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnableShare: (projectId: string) => Promise<{ slug?: string; error?: string }>
  onDisableShare: (projectId: string) => Promise<{ error?: string }>
}

export function ShareProjectDialog({
  project,
  open,
  onOpenChange,
  onEnableShare,
  onDisableShare,
}: ShareProjectDialogProps) {
  const [isShared, setIsShared] = useState(false)
  const [shareSlug, setShareSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (project) {
      setIsShared(project.isShared ?? false)
      setShareSlug(project.shareSlug ?? null)
      setError(null)
    }
  }, [project])

  async function handleTurnOn() {
    if (!project) return
    setLoading(true)
    setError(null)
    try {
      const result = await onEnableShare(project.id)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.slug) {
        setShareSlug(result.slug)
        setIsShared(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleTurnOff() {
    if (!project) return
    setLoading(true)
    setError(null)
    try {
      const result = await onDisableShare(project.id)
      if (result.error) {
        setError(result.error)
        return
      }
      setIsShared(false)
    } finally {
      setLoading(false)
    }
  }

  function getPublicUrl(): string {
    if (typeof window === "undefined" || !shareSlug) return ""
    return `${window.location.origin}/view/${shareSlug}`
  }

  async function handleCopy() {
    const url = getPublicUrl()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Could not copy to clipboard")
    }
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Allow anyone with the link to view this project&apos;s renders.
          </p>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-sm font-medium">Share link</span>
            <Button
              type="button"
              variant={isShared ? "secondary" : "default"}
              size="sm"
              disabled={loading}
              onClick={isShared ? handleTurnOff : handleTurnOn}
            >
              {loading ? "…" : isShared ? "Turn off" : "Turn on"}
            </Button>
          </div>
          {isShared && shareSlug && (
            <div className="flex gap-2">
              <Input
                readOnly
                value={getPublicUrl()}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
