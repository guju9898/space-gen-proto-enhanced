"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  registerContentUpload,
  runContentRendersNow,
  signContentUpload,
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

export function RunNowButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(null)
            const res = await runContentRendersNow()
            if (!res.ok) {
              setResult(res.error)
            } else {
              const s = res.summary
              setResult(
                `Rendered ${s.rendered}, failed ${s.failed}, still queued ${s.stillQueued}` +
                  (s.errors.length ? `. ${s.errors[0]}` : "")
              )
            }
            router.refresh()
          })
        }
      >
        {pending ? "Rendering (up to 4 min)…" : "Run today's renders now"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  )
}
