"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Columns2, Copy, Download, Link2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CompareSlider } from "@/components/Studio/CompareSlider"
import {
  renameProject,
  enableProjectShare,
  disableProjectShare,
  setProjectPresentingOn,
} from "@/app/studio/projects/actions"
import { downloadImage, formatProjectType, formatRelativeDate } from "@/lib/projects/utils"
import { presentingLabel } from "@/lib/projects/presenting"
import type { Project, ProjectRender } from "@/lib/projects/types"

export function ProjectDetail({ project, renders }: { project: Project; renders: ProjectRender[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Rename
  const [name, setName] = useState(project.name)
  const [nameDraft, setNameDraft] = useState(project.name)
  const [editingName, setEditingName] = useState(false)
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Client link
  const [isShared, setIsShared] = useState(Boolean(project.isShared))
  const [shareSlug, setShareSlug] = useState(project.shareSlug ?? null)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  // Presenting date
  const [savedDate, setSavedDate] = useState(project.presentingOn?.slice(0, 10) ?? "")
  const [dateDraft, setDateDraft] = useState(project.presentingOn?.slice(0, 10) ?? "")
  const [dateBusy, setDateBusy] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(null)

  const [compare, setCompare] = useState<ProjectRender | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
    setNow(new Date())
  }, [])

  const label = now ? presentingLabel(savedDate || null, now) : null
  const viewPath = shareSlug ? `/view/${shareSlug}` : null
  const viewUrl = viewPath ? `${origin}${viewPath}` : null

  async function saveName() {
    const next = nameDraft.trim()
    if (!next) {
      setNameError("Give the project a name")
      return
    }
    if (next === name) {
      setEditingName(false)
      return
    }
    setNameBusy(true)
    setNameError(null)
    try {
      const res = await renameProject(project.id, next)
      if (res.error) {
        setNameError(res.error)
        return
      }
      setName(next)
      setEditingName(false)
      startTransition(() => router.refresh())
    } finally {
      setNameBusy(false)
    }
  }

  async function toggleShare() {
    setShareBusy(true)
    setShareError(null)
    try {
      if (isShared) {
        const res = await disableProjectShare(project.id)
        if ("error" in res) {
          setShareError(res.error)
          return
        }
        setIsShared(false)
      } else {
        const res = await enableProjectShare(project.id)
        if ("error" in res) {
          setShareError(res.error)
          return
        }
        setShareSlug(res.slug)
        setIsShared(true)
      }
    } finally {
      setShareBusy(false)
    }
  }

  async function savePresenting(value: string | null) {
    setDateBusy(true)
    setDateError(null)
    try {
      const res = await setProjectPresentingOn(project.id, value)
      if (res.error) {
        setDateError(res.error)
        return
      }
      setSavedDate(value ?? "")
      setDateDraft(value ?? "")
      setNow(new Date())
    } finally {
      setDateBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Title + rename */}
      <section>
        {editingName ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void saveName()
            }}
          >
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={120}
              autoFocus
              aria-label="Project name"
              className="max-w-sm"
            />
            <Button type="submit" size="sm" disabled={nameBusy}>
              {nameBusy ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingName(false)
                setNameDraft(name)
                setNameError(null)
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{name}</h1>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={() => setEditingName(true)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Rename
            </Button>
          </div>
        )}
        {nameError && <p className="mt-1 text-sm text-destructive">{nameError}</p>}
        <p className="mt-1 text-sm text-muted-foreground">
          {formatProjectType(project.projectType)} · {renders.length} version{renders.length !== 1 ? "s" : ""} · Updated{" "}
          {formatRelativeDate(project.updatedAt)}
          {label ? ` · ${label}` : ""}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Client link */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Client link
            </h2>
            <Button
              type="button"
              size="sm"
              variant={isShared ? "outline" : "default"}
              onClick={toggleShare}
              disabled={shareBusy}
            >
              {shareBusy ? "Working…" : isShared ? "Turn off" : "Turn on"}
            </Button>
          </div>
          {isShared && viewPath ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Anyone with this link can see every version, view-only.
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={viewUrl ?? viewPath}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Client link"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(viewUrl ?? viewPath)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    } catch {
                      setCopied(false)
                    }
                  }}
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <a href={viewPath} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-2">
                Preview {viewPath}
              </a>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Off. Turn it on to get a private link to send your client.
            </p>
          )}
          {shareError && <p className="text-sm text-destructive">{shareError}</p>}
        </section>

        {/* Presenting on */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">When are you showing this?</h2>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void savePresenting(dateDraft || null)
            }}
          >
            <Input
              type="date"
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
              aria-label="Presenting date"
              className="w-auto"
            />
            <Button type="submit" size="sm" disabled={dateBusy || dateDraft === savedDate}>
              {dateBusy ? "Saving…" : "Save"}
            </Button>
            {savedDate && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={dateBusy}
                onClick={() => void savePresenting(null)}
              >
                Clear
              </Button>
            )}
          </form>
          {label ? (
            <p className="text-sm font-medium text-primary">{label}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Optional. Add the meeting date to keep this job on your radar.</p>
          )}
          {dateError && <p className="text-sm text-destructive">{dateError}</p>}
        </section>
      </div>

      {/* Versions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Versions</h2>
        {renders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No renders in this project yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {renders.map((r, i) => (
              <li key={r.id} className="rounded-lg border border-border bg-card p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.thumbnailUrl || r.imageUrl}
                  alt={`Version ${renders.length - i}`}
                  className="aspect-[4/3] w-full rounded-md bg-muted object-cover"
                  loading="lazy"
                />
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    V{renders.length - i} · {formatRelativeDate(r.createdAt)}
                  </span>
                  <div className="flex gap-1">
                    {r.sourceImageUrl && (
                      <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => setCompare(r)}>
                        <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Compare
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() =>
                        downloadImage(r.imageUrl, `${name.replace(/[^a-z0-9-_]/gi, "_")}-v${renders.length - i}.png`)
                      }
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Download
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={!!compare} onOpenChange={(open) => !open && setCompare(null)}>
        <DialogContent className="max-h-[95dvh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Photo and render</DialogTitle>
            <DialogDescription>Drag across the image, or use the slider, to compare.</DialogDescription>
          </DialogHeader>
          {compare?.sourceImageUrl && <CompareSlider beforeSrc={compare.sourceImageUrl} afterSrc={compare.imageUrl} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
