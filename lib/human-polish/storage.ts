/**
 * Private upload path building and validation for human-polish-uploads.
 */

import { randomUUID } from "crypto"
import {
  EXTENSION_TO_MIME,
  HUMAN_POLISH_ALLOWED_EXTENSIONS,
  HUMAN_POLISH_MAX_BYTES_PER_FILE,
  HUMAN_POLISH_UPLOAD_BUCKET,
  isAllowedMimeType,
  type HumanPolishAllowedMimeType,
} from "./config"
import type { HumanPolishFileType } from "./types"

export function sanitizeFilename(original: string): string {
  const base = original.split(/[/\\]/).pop() ?? "file"
  const cleaned = base
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120)
  return cleaned.length > 0 ? cleaned : "file"
}

export function extensionFromFilename(filename: string): string | null {
  const parts = filename.toLowerCase().split(".")
  if (parts.length < 2) return null
  return parts[parts.length - 1] ?? null
}

export type UploadMetaValidation =
  | {
      ok: true
      mimeType: HumanPolishAllowedMimeType
      sanitizedFilename: string
      extension: string
    }
  | { ok: false; error: string }

/**
 * Validates filename, claimed MIME, and size before issuing a signed upload URL.
 * Extension and MIME must agree.
 */
export function validateUploadMeta(input: {
  filename: unknown
  mimeType: unknown
  sizeBytes: unknown
}): UploadMetaValidation {
  if (typeof input.filename !== "string" || !input.filename.trim()) {
    return { ok: false, error: "filename is required." }
  }
  if (typeof input.mimeType !== "string" || !isAllowedMimeType(input.mimeType)) {
    return { ok: false, error: "Only JPEG, PNG, and PDF files are allowed." }
  }
  if (typeof input.sizeBytes !== "number" || !Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { ok: false, error: "sizeBytes must be a positive number." }
  }
  if (input.sizeBytes > HUMAN_POLISH_MAX_BYTES_PER_FILE) {
    return { ok: false, error: "Each file must be 25 MB or smaller." }
  }

  const sanitizedFilename = sanitizeFilename(input.filename.trim())
  const ext = extensionFromFilename(sanitizedFilename)
  if (!ext || !(HUMAN_POLISH_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, error: "File extension must be .jpg, .jpeg, .png, or .pdf." }
  }

  const mimeFromExt = EXTENSION_TO_MIME[ext]
  if (!mimeFromExt || mimeFromExt !== input.mimeType) {
    return { ok: false, error: "File extension does not match MIME type." }
  }

  return {
    ok: true,
    mimeType: input.mimeType,
    sanitizedFilename,
    extension: ext,
  }
}

/**
 * Object path: {request_id}/{file_type}/{uuid}-{sanitized_filename}
 */
export function buildObjectPath(
  requestId: string,
  fileType: HumanPolishFileType,
  sanitizedFilename: string
): string {
  return `${requestId}/${fileType}/${randomUUID()}-${sanitizedFilename}`
}

export { HUMAN_POLISH_UPLOAD_BUCKET }
