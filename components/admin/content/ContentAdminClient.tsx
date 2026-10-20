"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  registerContentUpload,
  reviewRender,
  runContentRendersNow,
  signContentUpload,
  writeAllRenderSeoText,
  writeRenderSeoText,
} from "@/lib/content/admin-actions"

const SCENE_OPTIONS: { value: string; label: string }[] = [
  { value: "backyard", label: "Backyard" },
  { value: "front_yard", label: "Front yard" },
  { value: "patio", label: "Patio" },
  { value: "pool", label: "Existing pool" },
  { value: "house_exterior", label: "House exterior" },
  { value: "interior", label: "Interior room" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
]

export function SourceUploader() {
  const router = useRouter()
  const [scene, setScene] = useState("backyard")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    let done = 0
    const problems: string[] = []
    for (const file of Array.from(files)) {
      setStatus(`Uploading ${done + 1} of ${files.length}…`)
      const signed = await signContentUpload({ mimeType: file.type, sizeBytes: file.size })
      if (!signed.ok) {
        problems.push(`${file.name}: ${signed.error}`)
        continue
      }
      const put = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      })
      if (!put.ok) {
        problems.push(`${file.name}: upload failed`)
        continue
      }
      const saved = await registerContentUpload({ path: signed.path, scene, notes })
      if (!saved.ok) {
        problems.push(`${file.name}: ${saved.error}`)
        continue
      }
      done++
    }
    setBusy(false)
    setStatus(
      `${done} photo${done === 1 ? "" : "s"} added.` + (problems.length ? ` Problems: ${problems.join("; ")}` : "")
    )
    router.refresh()
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#343434] bg-[#0d1119] p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">What the photos show</span>
          <select
            className="rounded-md border border-[#343434] bg-[#0a0d14] px-3 py-2 text-sm"
            value={scene}
            onChange={(e) => setScene(e.target.value)}
          >
            {SCENE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Notes (optional, e.g. "sloped lot, west Austin")</span>
          <input
            className="w-full rounded-md border border-[#343434] bg-[#0a0d14] px-3 py-2 text-sm"
            value={notes}
            maxLength={300}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <label className="cursor-pointer">
          <span className="inline-flex h-10 items-center rounded-md bg-white px-4 text-sm font-medium text-black">
            {busy ? "Uploading…" : "Choose photos"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void handleFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Your own job-site photos only (JPG, PNG or WEBP, under 10 MB). Never upload customer photos here.
      </p>
      {status && <p className="text-sm">{status}</p>}
    </div>
  )
}

export function RunNowButton({ todayCount = 0, target = 18 }: { todayCount?: number; target?: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  const full = todayCount >= target
  const [extra, setExtra] = useState(full ? 4 : 0)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm">
        <span className="sr-only">How many</span>
        <select
          className="h-10 rounded-md border border-[#343434] bg-[#0a0d14] px-3 text-sm"
          value={extra}
          disabled={pending}
          onChange={(e) => setExtra(Number(e.target.value))}
        >
          {!full && <option value={0}>Finish today&apos;s batch ({Math.max(target - todayCount, 0)} left)</option>}
          {[4, 8, 12].map((n) => (
            <option key={n} value={n}>
              {n} extra renders
            </option>
          ))}
        </select>
      </label>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(null)
            const res = await runContentRendersNow(extra)
            if (!res.ok) {
              setResult(res.error)
            } else {
              const s = res.summary
              setResult(
                s.rendered + s.failed + s.stillQueued === 0
                  ? "Nothing to render: today's batch is complete. Pick a number of extra renders and run again."
                  : `Rendered ${s.rendered}, failed ${s.failed}, still queued ${s.stillQueued}` +
                      (s.stillQueued ? " (run again to finish)" : "") +
                      (s.errors.length ? `. ${s.errors[0]}` : "")
              )
            }
            router.refresh()
          })
        }
      >
        {pending ? "Rendering (up to 4 min)…" : "Run renders now"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  )
}

type ReviewProps = {
  id: string
  reviewStatus: string
  published: boolean
  hasSeoText: boolean
  publicSlug: string | null
}

/** Approve / reject controls for one render. Approve writes SEO text first when it's missing. */
export function RenderReviewButtons({ id, reviewStatus, published, hasSeoText, publicSlug }: ReviewProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  const run = (fn: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) =>
    startTransition(async () => {
      setNote(null)
      const res = await fn()
      setNote(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error })
      router.refresh()
    })

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex flex-wrap items-center gap-2">
        {reviewStatus === "rejected" ? (
          <button disabled={pending} onClick={() => run(() => reviewRender(id, "reset"))} className="underline underline-offset-2">
            Undo reject
          </button>
        ) : published ? (
          <>
            {publicSlug && (
              <a href={`/gallery/${publicSlug}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                View page
              </a>
            )}
            <button disabled={pending} onClick={() => run(() => reviewRender(id, "reset"))} className="underline underline-offset-2">
              Unpublish
            </button>
          </>
        ) : (
          <>
            <button
              disabled={pending}
              onClick={() => run(() => reviewRender(id, "approve"))}
              className="rounded bg-emerald-500 px-2.5 py-1 font-medium text-black disabled:opacity-50"
            >
              {pending ? "Working…" : hasSeoText ? "Approve & publish" : "Write SEO text & publish"}
            </button>
            <button
              disabled={pending}
              onClick={() => run(() => reviewRender(id, "reject"))}
              className="rounded border border-red-400/60 px-2.5 py-1 text-red-300 disabled:opacity-50"
            >
              Reject
            </button>
            {!hasSeoText && (
              <button disabled={pending} onClick={() => run(() => writeRenderSeoText(id))} className="underline underline-offset-2">
                Write SEO text only
              </button>
            )}
          </>
        )}
      </div>
      {note && <p className={note.ok ? "text-emerald-300" : "text-red-300"}>{note.text}</p>}
    </div>
  )
}

export function WriteAllSeoButton({ missing }: { missing: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  if (missing === 0 && !result) return null
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await writeAllRenderSeoText()
            setResult(res.ok ? res.message : res.error)
            router.refresh()
          })
        }
      >
        {pending ? "Writing SEO text (up to 3 min)…" : `Write SEO text for all (${missing})`}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  )
}
