"use client"

/**
 * Minimal paid replacement-file uploader.
 * Uses replacementToken (not draftToken) against upload sign/complete.
 */

import { useCallback, useState } from "react"
import {
  HUMAN_POLISH_ALLOWED_EXTENSIONS,
  HUMAN_POLISH_MAX_BYTES_PER_FILE,
  HUMAN_POLISH_MAX_FILES_PER_REQUEST,
} from "@/lib/human-polish/config"
import type { HumanPolishFileType } from "@/lib/human-polish/types"
import { HUMAN_POLISH_FILE_TYPE_LABELS, HUMAN_POLISH_FILE_TYPES } from "@/lib/human-polish/types"
import { checkFileForUpload } from "@/components/human-polish/intake/validation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  requestId: string
  replacementToken: string
  expiresAt: string | null
}

type UploadedRow = {
  fileId: string
  originalFilename: string
  fileType: HumanPolishFileType
}

type PendingRow = {
  localId: string
  filename: string
  status: "working" | "error" | "done"
  error?: string
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body?.error ?? fallback
  } catch {
    return fallback
  }
}

export function ReplacementUploadForm({ requestId, replacementToken, expiresAt }: Props) {
  const [fileType, setFileType] = useState<HumanPolishFileType>("site_photos")
  const [uploaded, setUploaded] = useState<UploadedRow[]>([])
  const [pending, setPending] = useState<PendingRow[]>([])
  const [busy, setBusy] = useState(false)

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setBusy(true)

      for (const file of Array.from(files)) {
        const localId = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const check = checkFileForUpload(file, 0, uploaded.length)
        if (!check.ok) {
          setPending((prev) => [
            ...prev,
            { localId, filename: file.name, status: "error", error: check.error },
          ])
          continue
        }

        setPending((prev) => [...prev, { localId, filename: file.name, status: "working" }])

        try {
          const signRes = await fetch("/api/human-polish/upload/sign", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              requestId,
              replacementToken,
              fileType,
              filename: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
            }),
          })
          if (!signRes.ok) {
            const error = await readError(signRes, "Could not start the upload.")
            setPending((prev) =>
              prev.map((p) => (p.localId === localId ? { ...p, status: "error", error } : p))
            )
            continue
          }
          const signed = (await signRes.json()) as {
            signedUrl: string
            objectPath: string
            mimeType: string
            originalFilename: string
            sizeBytes: number
          }

          const putRes = await fetch(signed.signedUrl, {
            method: "PUT",
            headers: { "content-type": file.type },
            body: file,
          })
          if (!putRes.ok) {
            setPending((prev) =>
              prev.map((p) =>
                p.localId === localId
                  ? { ...p, status: "error", error: "Upload to storage failed. Please try again." }
                  : p
              )
            )
            continue
          }

          const completeRes = await fetch("/api/human-polish/upload/complete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              requestId,
              replacementToken,
              objectPath: signed.objectPath,
              fileType,
              originalFilename: signed.originalFilename,
              mimeType: signed.mimeType,
              sizeBytes: signed.sizeBytes,
            }),
          })
          if (!completeRes.ok) {
            const error = await readError(completeRes, "Could not register the uploaded file.")
            setPending((prev) =>
              prev.map((p) => (p.localId === localId ? { ...p, status: "error", error } : p))
            )
            continue
          }
          const done = (await completeRes.json()) as { fileId: string; originalFilename?: string }

          setUploaded((prev) => [
            ...prev,
            {
              fileId: done.fileId,
              originalFilename: done.originalFilename ?? signed.originalFilename,
              fileType,
            },
          ])
          setPending((prev) => prev.filter((p) => p.localId !== localId))
        } catch {
          setPending((prev) =>
            prev.map((p) =>
              p.localId === localId
                ? { ...p, status: "error", error: "Network error during upload. Please try again." }
                : p
            )
          )
        }
      }

      setBusy(false)
    },
    [fileType, requestId, replacementToken, uploaded.length]
  )

  return (
    <div className="space-y-6">
      {expiresAt ? (
        <p className="text-sm text-muted-foreground">
          This secure upload link expires{" "}
          <time dateTime={expiresAt}>{new Date(expiresAt).toLocaleString()}</time>.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="reupload-type">File category</Label>
        <Select
          value={fileType}
          onValueChange={(v) => setFileType(v as HumanPolishFileType)}
          disabled={busy}
        >
          <SelectTrigger id="reupload-type" className="max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HUMAN_POLISH_FILE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {HUMAN_POLISH_FILE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reupload-input">Choose files</Label>
        <input
          id="reupload-input"
          type="file"
          multiple
          accept={HUMAN_POLISH_ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          disabled={busy || uploaded.length >= HUMAN_POLISH_MAX_FILES_PER_REQUEST}
          onChange={(e) => {
            void uploadFiles(e.target.files)
            e.target.value = ""
          }}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, or PDF · up to {Math.floor(HUMAN_POLISH_MAX_BYTES_PER_FILE / (1024 * 1024))}{" "}
          MB each · max {HUMAN_POLISH_MAX_FILES_PER_REQUEST} files total for this request
          (including any earlier uploads).
        </p>
      </div>

      {pending.length > 0 ? (
        <ul className="space-y-2 text-sm" aria-live="polite">
          {pending.map((p) => (
            <li key={p.localId}>
              {p.filename}:{" "}
              {p.status === "working" ? "Uploading…" : p.error || "Error"}
            </li>
          ))}
        </ul>
      ) : null}

      {uploaded.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Uploaded in this session</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {uploaded.map((u) => (
              <li key={u.fileId}>
                {u.originalFilename} · {HUMAN_POLISH_FILE_TYPE_LABELS[u.fileType]}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Files are attached to your request. You can close this page when finished.
          </p>
        </div>
      ) : null}

      <Button type="button" variant="outline" asChild>
        <a href="/human-polish">Back to Human Polish</a>
      </Button>
    </div>
  )
}
