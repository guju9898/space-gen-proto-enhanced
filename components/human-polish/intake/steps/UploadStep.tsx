"use client"

import { useRef, useState } from "react"
import { CheckCircle2, FileUp, Loader2, Trash2, UploadCloud, XCircle } from "lucide-react"
import {
  HUMAN_POLISH_MAX_BYTES_PER_FILE,
  HUMAN_POLISH_MAX_BYTES_PER_REQUEST,
  HUMAN_POLISH_MAX_FILES_PER_REQUEST,
} from "@/lib/human-polish/config"
import {
  HUMAN_POLISH_FILE_TYPE_LABELS,
  type HumanPolishFileType,
} from "@/lib/human-polish/types"
import { cn } from "@/lib/utils"
import type { PendingUpload, UploadedFile } from "../intakeTypes"
import { FILE_TYPE_OPTIONS } from "../intakeConfig"
import { FieldError } from "../fields"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface UploadStepProps {
  uploadedFiles: UploadedFile[]
  pending: PendingUpload[]
  isUploading: boolean
  formError?: string
  onUpload: (files: File[], fileType: HumanPolishFileType) => void
  onRemovePending: (localId: string) => void
}

const MAX_MB = HUMAN_POLISH_MAX_BYTES_PER_FILE / (1024 * 1024)
const MAX_TOTAL_MB = HUMAN_POLISH_MAX_BYTES_PER_REQUEST / (1024 * 1024)

export function UploadStep({
  uploadedFiles,
  pending,
  isUploading,
  formError,
  onUpload,
  onRemovePending,
}: UploadStepProps) {
  const [fileType, setFileType] = useState<HumanPolishFileType>("site_photos")
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalBytes = uploadedFiles.reduce((sum, f) => sum + f.sizeBytes, 0)
  const totalMb = totalBytes / (1024 * 1024)

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    onUpload(Array.from(list), fileType)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#343434] bg-[#191f33]/40 p-4 text-sm text-muted-foreground">
        <p>
          Files are stored in a <strong className="text-white">private</strong> bucket — never a
          public URL. Accepted: JPEG, PNG, PDF. Up to {HUMAN_POLISH_MAX_FILES_PER_REQUEST} files,{" "}
          {MAX_MB} MB per file, {MAX_TOTAL_MB} MB total.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white" htmlFor="hp-file-type">
          What are you uploading?
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FILE_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFileType(opt.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                fileType === opt.value
                  ? "border-orange-500/60 bg-gradient-to-r from-orange-500/15 to-violet-700/15 text-white"
                  : "border-[#343434] text-muted-foreground hover:bg-white/5",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-orange-500/60 bg-orange-500/5" : "border-[#343434] bg-[#10141f]/40",
        )}
      >
        <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-white">
          Drag &amp; drop, or{" "}
          <button
            type="button"
            className="font-semibold text-orange-300 underline-offset-2 hover:underline"
            onClick={() => inputRef.current?.click()}
          >
            browse files
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Adding as: {HUMAN_POLISH_FILE_TYPE_LABELS[fileType]}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      <FieldError message={formError} />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {uploadedFiles.length} / {HUMAN_POLISH_MAX_FILES_PER_REQUEST} files
        </span>
        <span>
          {totalMb.toFixed(1)} / {MAX_TOTAL_MB} MB
        </span>
      </div>

      {uploadedFiles.length > 0 || pending.length > 0 ? (
        <ul className="space-y-2">
          {uploadedFiles.map((f) => (
            <li
              key={f.objectPath}
              className="flex items-center gap-3 rounded-lg border border-[#343434] bg-[#191f33]/40 px-3 py-2"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{f.originalFilename}</p>
                <p className="text-xs text-muted-foreground">
                  {HUMAN_POLISH_FILE_TYPE_LABELS[f.fileType]} · {formatBytes(f.sizeBytes)}
                </p>
              </div>
            </li>
          ))}
          {pending.map((p) => (
            <li
              key={p.localId}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2",
                p.status === "error"
                  ? "border-red-500/40 bg-red-500/5"
                  : "border-[#343434] bg-[#191f33]/40",
              )}
            >
              {p.status === "error" ? (
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
              ) : (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-orange-300" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{p.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {p.status === "error"
                    ? (p.error ?? "Upload failed")
                    : `${p.status}… · ${formatBytes(p.sizeBytes)}`}
                </p>
              </div>
              {p.status === "error" ? (
                <button
                  type="button"
                  onClick={() => onRemovePending(p.localId)}
                  className="text-muted-foreground transition-colors hover:text-white"
                  aria-label="Dismiss"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-[#343434] bg-[#10141f]/40 px-3 py-4 text-sm text-muted-foreground">
          <FileUp className="h-4 w-4" />
          No files yet.
        </div>
      )}

      {isUploading ? (
        <p className="flex items-center gap-2 text-xs text-orange-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading securely…
        </p>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {uploadedFiles.length} files uploaded
      </div>
    </div>
  )
}
