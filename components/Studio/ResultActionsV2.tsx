"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, Columns2, Copy, Download, ExternalLink, FolderCheck, Loader2, Plus, Send, Share2, ThumbsDown, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/AuthContext"
import { CompareSlider } from "@/components/Studio/CompareSlider"
import { trackStudioEvent } from "@/components/Studio/analytics"
import { enableProjectShare } from "@/app/studio/projects/actions"
import { downloadImage } from "@/lib/projects/utils"
import { CREDITS_CHANGED_EVENT } from "@/components/Studio/StudioCreditPill"
import { FEEDBACK_REASONS, type FeedbackReasonId } from "@/lib/projects/feedback"

type StudioType = "interior" | "exterior" | "landscape"

type Job = { projectId: string; projectName: string; versions: number; shareSlug?: string | null }
type SavedRender = { renderId: string; storedUrl: string }

const jobKey = (studio: StudioType) => `rs_job_${studio}`

function loadJob(studio: StudioType): Job | null {
  try {
    const raw = sessionStorage.getItem(jobKey(studio))
    return raw ? (JSON.parse(raw) as Job) : null
  } catch {
    return null
  }
}

function storeJob(studio: StudioType, job: Job | null) {
  try {
    if (job) sessionStorage.setItem(jobKey(studio), JSON.stringify(job))
    else sessionStorage.removeItem(jobKey(studio))
  } catch {
    /* storage blocked: the job lasts for this page view */
  }
}

/**
 * Studio v2 result actions (spec Phase 2): auto-save each new render into the current
 * job's project, compare with the photo, one "Send to client" flow, download, and
 * thumbs feedback. Uses the existing project and share actions; credits are untouched.
 */
export function ResultActionsV2({
  studio,
  currentRender,
  isRendering,
  sourceImageUrl,
}: {
  studio: StudioType
  currentRender: string | null
  isRendering: boolean
  sourceImageUrl: string | null
}) {
  const { status } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saved = useRef(new Map<string, SavedRender>())
  const [, bump] = useState(0)
  const [compareOpen, setCompareOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)

  useEffect(() => setJob(loadJob(studio)), [studio])

  const save = useCallback(
    async (url: string): Promise<{ job: Job; render: SavedRender } | null> => {
      const existing = saved.current.get(url)
      if (existing && job) return { job, render: existing }
      setSaving(true)
      setSaveError(null)
      try {
        const res = await fetch("/api/projects/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            studioType: studio,
            imageUrl: url,
            sourceImageUrl,
            projectId: job?.projectId ?? null,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        })
        const data = (await res.json().catch(() => null)) as
          | { projectId: string; projectName: string; renderId: string; imageUrl: string; versions: number; error?: string }
          | null
        if (!res.ok || !data || data.error) {
          setSaveError("This render wasn't saved to a project. Download it to keep a copy.")
          return null
        }
        const nextJob: Job = {
          projectId: data.projectId,
          projectName: data.projectName,
          versions: data.versions,
          shareSlug: job?.projectId === data.projectId ? job.shareSlug : null,
        }
        const render = { renderId: data.renderId, storedUrl: data.imageUrl }
        saved.current.set(url, render)
        setJob(nextJob)
        storeJob(studio, nextJob)
        bump((n) => n + 1)
        trackStudioEvent("render_autosaved", { studio, version: data.versions })
        return { job: nextJob, render }
      } catch {
        setSaveError("This render wasn't saved to a project. Download it to keep a copy.")
        return null
      } finally {
        setSaving(false)
      }
    },
    [job, sourceImageUrl, studio]
  )

  // Auto-save: when a render finishes and a new image is showing.
  const wasRendering = useRef(false)
  const renderAtStart = useRef<string | null>(null)
  useEffect(() => {
    if (isRendering && !wasRendering.current) renderAtStart.current = currentRender
    const finished = !isRendering && wasRendering.current
    wasRendering.current = isRendering
    if (!finished || status !== "authenticated") return
    window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT))
    if (currentRender && currentRender !== renderAtStart.current && !saved.current.has(currentRender)) {
      void save(currentRender)
    }
  }, [isRendering, currentRender, status, save])

  if (status !== "authenticated" || !currentRender) {
    return job ? <JobLine job={job} saving={false} onNewJob={() => { setJob(null); storeJob(studio, null) }} /> : null
  }

  const savedRender = saved.current.get(currentRender)

  return (
    <div className="space-y-3">
      <JobLine
        job={job}
        saving={saving}
        error={saveError}
        onNewJob={() => {
          setJob(null)
          storeJob(studio, null)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" className="gap-2" onClick={() => setSendOpen(true)} disabled={isRendering}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Send to client
        </Button>
        {sourceImageUrl && (
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => {
            setCompareOpen(true)
            trackStudioEvent("compare_opened", { studio })
          }}>
            <Columns2 className="h-4 w-4" aria-hidden="true" />
            Compare with photo
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => downloadImage(savedRender?.storedUrl ?? currentRender, `${studio}-render.png`)}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download
        </Button>
      </div>

      <FeedbackRow key={currentRender} studio={studio} renderUrl={savedRender?.storedUrl ?? currentRender} projectRenderId={savedRender?.renderId ?? null} />

      {sourceImageUrl && (
        <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
          <DialogContent className="max-h-[95dvh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Photo and render</DialogTitle>
              <DialogDescription>Drag across the image, or use the slider, to compare.</DialogDescription>
            </DialogHeader>
            <CompareSlider beforeSrc={sourceImageUrl} afterSrc={currentRender} />
          </DialogContent>
        </Dialog>
      )}

      <SendToClientDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        job={job}
        ensureSaved={async () => (await save(currentRender))?.job ?? null}
        onShared={(slug) => {
          if (!job) return
          const next = { ...job, shareSlug: slug }
          setJob(next)
          storeJob(studio, next)
        }}
      />
    </div>
  )
}

function JobLine({
  job,
  saving,
  error,
  onNewJob,
}: {
  job: Job | null
  saving: boolean
  error?: string | null
  onNewJob: () => void
}) {
  if (error) return <p className="text-xs text-destructive">{error}</p>
  if (saving) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Saving to your project…
      </p>
    )
  }
  if (!job) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span className="flex min-w-0 items-center gap-1.5">
        <FolderCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">
          Saved to{" "}
          <Link href={`/studio/projects/${job.projectId}`} className="font-medium text-foreground underline underline-offset-2">
            {job.projectName}
          </Link>
          {job.versions > 1 ? ` · ${job.versions} versions` : ""}
        </span>
      </span>
      <button type="button" onClick={onNewJob} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        New job
      </button>
    </div>
  )
}

function FeedbackRow({ studio, renderUrl, projectRenderId }: { studio: StudioType; renderUrl: string; projectRenderId: string | null }) {
  const [rating, setRating] = useState<1 | -1 | null>(null)
  const [reasons, setReasons] = useState<FeedbackReasonId[]>([])
  const [sent, setSent] = useState(false)

  const send = async (r: 1 | -1, why: FeedbackReasonId[]) => {
    trackStudioEvent("render_feedback", { studio, rating: r })
    if (!renderUrl.startsWith("https://")) return
    await fetch("/api/render-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ renderUrl, studioType: studio, rating: r, reasons: why, projectRenderId }),
    }).catch(() => undefined)
  }

  if (sent) return <p className="text-xs text-muted-foreground">Thanks. That helps us tune the renders.</p>

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>How did this render turn out?</span>
        <button
          type="button"
          aria-label="Good render"
          aria-pressed={rating === 1}
          onClick={() => {
            setRating(1)
            setSent(true)
            void send(1, [])
          }}
          className={cn("rounded-md border border-border p-1.5 hover:text-foreground", rating === 1 && "border-primary text-primary")}
        >
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Bad render"
          aria-pressed={rating === -1}
          onClick={() => setRating(-1)}
          className={cn("rounded-md border border-border p-1.5 hover:text-foreground", rating === -1 && "border-primary text-primary")}
        >
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {rating === -1 && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-xs font-medium">What went wrong?</p>
          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_REASONS.map((r) => {
              const on = reasons.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setReasons((cur) => (on ? cur.filter((x) => x !== r.id) : [...cur, r.id]))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    on ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSent(true)
              void send(-1, reasons)
            }}
          >
            Send feedback
          </Button>
        </div>
      )}
    </div>
  )
}

function SendToClientDialog({
  open,
  onOpenChange,
  job,
  ensureSaved,
  onShared,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
  ensureSaved: () => Promise<Job | null>
  onShared: (slug: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setCopied(false)
    setLink(job?.shareSlug ? `${window.location.origin}/view/${job.shareSlug}` : null)
  }, [open, job?.shareSlug])

  const createLink = async () => {
    setBusy(true)
    setError(null)
    try {
      const current = job ?? (await ensureSaved())
      if (!current) {
        setError("Couldn't save this render to a project yet. Try again in a moment.")
        return
      }
      const result = await enableProjectShare(current.projectId)
      if ("error" in result) {
        setError(result.error)
        return
      }
      onShared(result.slug)
      setLink(`${window.location.origin}/view/${result.slug}`)
      trackStudioEvent("share_link_created")
    } finally {
      setBusy(false)
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send to client</DialogTitle>
          <DialogDescription>
            {job ? (
              <>
                Creates a view-only page for <span className="font-medium text-foreground">{job.projectName}</span> with every version in
                it.
              </>
            ) : (
              "Creates a view-only page with this render."
            )}{" "}
            Anyone with the link can see it. You can turn the link off in Projects.
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input readOnly value={link} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base sm:text-sm" onFocus={(e) => e.currentTarget.select()} />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link)
                    setCopied(true)
                  } catch {
                    setCopied(false)
                  }
                }}
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {canNativeShare && (
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => navigator.share({ title: job?.projectName ?? "Design concept", url: link }).catch(() => undefined)}
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share…
                </Button>
              )}
              <Button asChild type="button" variant="outline" className="gap-2">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Preview the page
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" className="gap-2" onClick={createLink} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Create client link
          </Button>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
