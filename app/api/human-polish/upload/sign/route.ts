/**
 * POST /api/human-polish/upload/sign
 * Issue a short-lived signed upload URL for the private human-polish-uploads bucket.
 *
 * Body: { requestId, draftToken | replacementToken, fileType, filename, mimeType, sizeBytes }
 * Validates MIME, extension, per-file size, file count, and total request size server-side.
 */

import { NextResponse } from "next/server"
import {
  HUMAN_POLISH_MAX_BYTES_PER_REQUEST,
  HUMAN_POLISH_MAX_FILES_PER_REQUEST,
  HUMAN_POLISH_SIGNED_URL_EXPIRES_IN,
  HUMAN_POLISH_UPLOAD_BUCKET,
} from "@/lib/human-polish/config"
import { checkRateLimit, getClientIp, HP_RATE_LIMITS } from "@/lib/human-polish/rate-limit"
import { buildObjectPath, validateUploadMeta } from "@/lib/human-polish/storage"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import { isHumanPolishFileType } from "@/lib/human-polish/types"
import { authenticateCustomerUpload } from "@/lib/human-polish/upload-auth"
import { isObject } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(
    "upload-sign",
    ip,
    HP_RATE_LIMITS.uploadSign.limit,
    HP_RATE_LIMITS.uploadSign.windowMs
  )
  if (rl.configurationError) {
    return NextResponse.json(
      { error: "Human Polish rate limiting is not configured." },
      { status: 503 }
    )
  }
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many upload requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    )
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Human Polish is not configured." }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!isObject(parsed)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }
    body = parsed
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const auth = await authenticateCustomerUpload(supabase, body)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, ...(auth.code ? { code: auth.code } : {}) },
      { status: auth.status }
    )
  }

  if (!isHumanPolishFileType(body.fileType)) {
    return NextResponse.json({ error: "Invalid fileType." }, { status: 400 })
  }

  const meta = validateUploadMeta({
    filename: body.filename,
    mimeType: body.mimeType,
    sizeBytes: body.sizeBytes,
  })
  if (!meta.ok) {
    return NextResponse.json({ error: meta.error }, { status: 400 })
  }

  const requestId = auth.request.id

  const { data: existingFiles, error: filesError } = await supabase
    .from("human_polish_files")
    .select("size_bytes")
    .eq("request_id", requestId)

  if (filesError) {
    console.error("[human-polish] file quota lookup failed")
    return NextResponse.json({ error: "Failed to validate upload limits." }, { status: 500 })
  }

  const fileCount = existingFiles?.length ?? 0
  if (fileCount >= HUMAN_POLISH_MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum of ${HUMAN_POLISH_MAX_FILES_PER_REQUEST} files per request.` },
      { status: 400 }
    )
  }

  const totalBytes =
    (existingFiles ?? []).reduce((sum, f) => sum + Number(f.size_bytes ?? 0), 0) +
    Number(body.sizeBytes)

  if (totalBytes > HUMAN_POLISH_MAX_BYTES_PER_REQUEST) {
    return NextResponse.json(
      { error: "Total upload size for this request cannot exceed 250 MB." },
      { status: 400 }
    )
  }

  const objectPath = buildObjectPath(requestId, body.fileType, meta.sanitizedFilename)

  const { data: signed, error: signError } = await supabase.storage
    .from(HUMAN_POLISH_UPLOAD_BUCKET)
    .createSignedUploadUrl(objectPath)

  if (signError || !signed?.signedUrl || !signed.token) {
    console.error("[human-polish] signed upload URL failed")
    return NextResponse.json({ error: "Failed to create signed upload URL." }, { status: 500 })
  }

  return NextResponse.json({
    bucket: HUMAN_POLISH_UPLOAD_BUCKET,
    objectPath: signed.path ?? objectPath,
    token: signed.token,
    signedUrl: signed.signedUrl,
    expiresIn: HUMAN_POLISH_SIGNED_URL_EXPIRES_IN,
    mimeType: meta.mimeType,
    fileType: body.fileType,
    originalFilename: typeof body.filename === "string" ? body.filename.trim() : meta.sanitizedFilename,
    sizeBytes: body.sizeBytes,
    // Draft inactivity window or replacement-upload absolute expiry.
    expiresAt: auth.expiresAt,
  })
}
