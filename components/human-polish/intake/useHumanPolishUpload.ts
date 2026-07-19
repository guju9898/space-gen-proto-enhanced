"use client"

/**
 * Human Polish™ intake — private upload hook.
 *
 * Drives the server-authorized upload flow for each file:
 *   1. POST /api/human-polish/upload/sign     → short-lived signed upload URL
 *   2. PUT  <signedUrl>                        → direct upload to private bucket
 *   3. POST /api/human-polish/upload/complete  → register file metadata row
 *
 * The bucket is private (no public URL). All quota/MIME/size checks are enforced
 * server-side; the client pre-check only provides fast feedback.
 */

import { useCallback, useState } from "react"
import type { HumanPolishFileType } from "@/lib/human-polish/types"
import type { DraftSession, PendingUpload, UploadedFile } from "./intakeTypes"
import { checkFileForUpload } from "./validation"

let localCounter = 0
function nextLocalId(): string {
  localCounter += 1
  return `u_${Date.now()}_${localCounter}`
}

interface UseUploadArgs {
  session: DraftSession | null
  uploadedFiles: UploadedFile[]
  onRegistered: (file: UploadedFile) => void
}

interface SignResponse {
  signedUrl: string
  objectPath: string
  mimeType: string
  fileType: HumanPolishFileType
  originalFilename: string
  sizeBytes: number
}

interface CompleteResponse {
  fileId: string
  objectPath: string
  fileType?: HumanPolishFileType
  originalFilename?: string
  mimeType?: string
  sizeBytes?: number
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body?.error ?? fallback
  } catch {
    return fallback
  }
}

export function useHumanPolishUpload({ session, uploadedFiles, onRegistered }: UseUploadArgs) {
  const [pending, setPending] = useState<PendingUpload[]>([])

  const patchPending = useCallback((localId: string, patch: Partial<PendingUpload>) => {
    setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, ...patch } : p)))
  }, [])

  const removePending = useCallback((localId: string) => {
    setPending((prev) => prev.filter((p) => p.localId !== localId))
  }, [])

  const uploadFiles = useCallback(
    async (files: File[], fileType: HumanPolishFileType) => {
      if (!session) return

      for (const file of files) {
        // Recompute running totals from what is already registered + still pending.
        const registeredBytes = uploadedFiles.reduce((sum, f) => sum + f.sizeBytes, 0)
        const pendingBytes = 0 // pending entries have not been counted server-side yet
        const check = checkFileForUpload(
          file,
          registeredBytes + pendingBytes,
          uploadedFiles.length,
        )

        const localId = nextLocalId()
        const base: PendingUpload = {
          localId,
          fileType,
          filename: file.name,
          sizeBytes: file.size,
          status: "queued",
        }

        if (!check.ok) {
          setPending((prev) => [...prev, { ...base, status: "error", error: check.error }])
          continue
        }

        setPending((prev) => [...prev, base])

        try {
          patchPending(localId, { status: "signing" })
          const signRes = await fetch("/api/human-polish/upload/sign", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              requestId: session.requestId,
              draftToken: session.draftToken,
              fileType,
              filename: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
            }),
          })
          if (!signRes.ok) {
            patchPending(localId, {
              status: "error",
              error: await readError(signRes, "Could not start the upload."),
            })
            continue
          }
          const signed = (await signRes.json()) as SignResponse

          patchPending(localId, { status: "uploading" })
          const putRes = await fetch(signed.signedUrl, {
            method: "PUT",
            headers: { "content-type": file.type },
            body: file,
          })
          if (!putRes.ok) {
            patchPending(localId, {
              status: "error",
              error: "Upload to storage failed. Please try again.",
            })
            continue
          }

          patchPending(localId, { status: "registering" })
          const completeRes = await fetch("/api/human-polish/upload/complete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              requestId: session.requestId,
              draftToken: session.draftToken,
              objectPath: signed.objectPath,
              fileType,
              originalFilename: signed.originalFilename,
              mimeType: signed.mimeType,
              sizeBytes: signed.sizeBytes,
            }),
          })
          if (!completeRes.ok) {
            patchPending(localId, {
              status: "error",
              error: await readError(completeRes, "Could not register the uploaded file."),
            })
            continue
          }
          const done = (await completeRes.json()) as CompleteResponse

          onRegistered({
            fileId: done.fileId,
            fileType: done.fileType ?? fileType,
            originalFilename: done.originalFilename ?? signed.originalFilename,
            mimeType: done.mimeType ?? signed.mimeType,
            sizeBytes: done.sizeBytes ?? signed.sizeBytes,
            objectPath: done.objectPath,
          })
          removePending(localId)
        } catch {
          patchPending(localId, {
            status: "error",
            error: "Network error during upload. Please try again.",
          })
        }
      }
    },
    [session, uploadedFiles, onRegistered, patchPending, removePending],
  )

  const isUploading = pending.some(
    (p) => p.status === "signing" || p.status === "uploading" || p.status === "registering",
  )

  return { pending, uploadFiles, removePending, isUploading }
}
