/**
 * POST /api/human-polish/upload/complete
 * Register a file row after the client uploaded to a signed URL.
 *
 * Body: {
 *   requestId, draftToken, objectPath, fileType,
 *   originalFilename, mimeType, sizeBytes
 * }
 *
 * Verifies the object exists in the private bucket before inserting metadata.
 * Never returns or stores a public URL.
 */

import { NextResponse } from "next/server"
import {
  HUMAN_POLISH_MAX_BYTES_PER_REQUEST,
  HUMAN_POLISH_MAX_FILES_PER_REQUEST,
  HUMAN_POLISH_UPLOAD_BUCKET,
} from "@/lib/human-polish/config"
import { authenticateDraftRequest } from "@/lib/human-polish/draft-auth"
import { checkRateLimit, getClientIp, HP_RATE_LIMITS } from "@/lib/human-polish/rate-limit"
import { validateUploadMeta } from "@/lib/human-polish/storage"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import { isHumanPolishFileType } from "@/lib/human-polish/types"
import { isObject, isString } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

function isPathBoundToRequest(objectPath: string, requestId: string, fileType: string): boolean {
  const prefix = `${requestId}/${fileType}/`
  return objectPath.startsWith(prefix) && !objectPath.includes("..")
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(
    "upload-complete",
    ip,
    HP_RATE_LIMITS.uploadComplete.limit,
    HP_RATE_LIMITS.uploadComplete.windowMs
  )
  if (rl.configurationError) {
    return NextResponse.json(
      { error: "Human Polish rate limiting is not configured." },
      { status: 503 }
    )
  }
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many upload completions. Please try again later." },
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

  const auth = await authenticateDraftRequest(supabase, body.requestId, body.draftToken)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!isHumanPolishFileType(body.fileType)) {
    return NextResponse.json({ error: "Invalid fileType." }, { status: 400 })
  }
  if (!isString(body.objectPath) || !body.objectPath.trim()) {
    return NextResponse.json({ error: "objectPath is required." }, { status: 400 })
  }

  const objectPath = body.objectPath.trim()
  const requestId = auth.request.id

  if (!isPathBoundToRequest(objectPath, requestId, body.fileType)) {
    return NextResponse.json({ error: "objectPath is not bound to this request." }, { status: 400 })
  }

  const meta = validateUploadMeta({
    filename: body.originalFilename,
    mimeType: body.mimeType,
    sizeBytes: body.sizeBytes,
  })
  if (!meta.ok) {
    return NextResponse.json({ error: meta.error }, { status: 400 })
  }

  const { data: existingFiles, error: filesError } = await supabase
    .from("human_polish_files")
    .select("id, size_bytes, object_path")
    .eq("request_id", requestId)

  if (filesError) {
    console.error("[human-polish] file list failed")
    return NextResponse.json({ error: "Failed to validate upload limits." }, { status: 500 })
  }

  const alreadyRegistered = (existingFiles ?? []).some((f) => f.object_path === objectPath)
  if (alreadyRegistered) {
    const existing = (existingFiles ?? []).find((f) => f.object_path === objectPath)
    return NextResponse.json({
      fileId: existing?.id,
      bucket: HUMAN_POLISH_UPLOAD_BUCKET,
      objectPath,
      alreadyRegistered: true,
    })
  }

  if ((existingFiles?.length ?? 0) >= HUMAN_POLISH_MAX_FILES_PER_REQUEST) {
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

  // Confirm object exists in private bucket (service role). No public URL.
  const folder = objectPath.includes("/")
    ? objectPath.slice(0, objectPath.lastIndexOf("/"))
    : ""
  const name = objectPath.includes("/")
    ? objectPath.slice(objectPath.lastIndexOf("/") + 1)
    : objectPath

  const { data: listed, error: listError } = await supabase.storage
    .from(HUMAN_POLISH_UPLOAD_BUCKET)
    .list(folder, { search: name, limit: 20 })

  if (listError) {
    console.error("[human-polish] storage list failed")
    return NextResponse.json({ error: "Failed to verify uploaded object." }, { status: 500 })
  }

  const found = (listed ?? []).some((item) => item.name === name)
  if (!found) {
    return NextResponse.json(
      { error: "Uploaded object not found. Complete the signed upload before registering." },
      { status: 400 }
    )
  }

  const originalFilename =
    typeof body.originalFilename === "string" ? body.originalFilename.trim() : meta.sanitizedFilename

  const { data: inserted, error: insertError } = await supabase
    .from("human_polish_files")
    .insert({
      request_id: requestId,
      bucket_name: HUMAN_POLISH_UPLOAD_BUCKET,
      object_path: objectPath,
      file_type: body.fileType,
      original_filename: originalFilename,
      mime_type: meta.mimeType,
      size_bytes: body.sizeBytes,
    })
    .select("id, request_id, bucket_name, object_path, file_type, original_filename, mime_type, size_bytes, created_at")
    .single()

  if (insertError || !inserted) {
    console.error("[human-polish] file row insert failed")
    return NextResponse.json({ error: "Failed to register uploaded file." }, { status: 500 })
  }

  return NextResponse.json({
    fileId: inserted.id,
    requestId: inserted.request_id,
    bucket: inserted.bucket_name,
    objectPath: inserted.object_path,
    fileType: inserted.file_type,
    originalFilename: inserted.original_filename,
    mimeType: inserted.mime_type,
    sizeBytes: inserted.size_bytes,
    createdAt: inserted.created_at,
  }, { status: 201 })
}
