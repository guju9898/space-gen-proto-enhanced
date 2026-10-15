"use server"

import { revalidatePath } from "next/cache"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import { SCENES, type Scene } from "@/lib/content/concepts"
import { CONTENT_SOURCES_BUCKET, runContentRenders, type RunSummary } from "@/lib/content/run"

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}
const MAX_BYTES = 10 * 1024 * 1024

type Fail = { ok: false; error: string }

/** Step 1 of an upload: a short-lived signed URL the browser PUTs the file to. */
export async function signContentUpload(input: {
  mimeType: string
  sizeBytes: number
}): Promise<{ ok: true; signedUrl: string; path: string } | Fail> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const ext = ALLOWED_TYPES[input.mimeType]
  if (!ext) return { ok: false, error: "Use JPG, PNG or WEBP photos." }
  if (!(input.sizeBytes > 0) || input.sizeBytes > MAX_BYTES) {
    return { ok: false, error: "Photos must be under 10 MB." }
  }

  const path = `own/${crypto.randomUUID()}.${ext}`
  const { data, error } = await auth.supabase.storage
    .from(CONTENT_SOURCES_BUCKET)
    .createSignedUploadUrl(path)
  if (error || !data?.signedUrl) return { ok: false, error: "Could not start the upload." }
  return { ok: true, signedUrl: data.signedUrl, path: data.path ?? path }
}

/** Step 2: register the uploaded file as a source photo. */
export async function registerContentUpload(input: {
  path: string
  scene: string
  notes?: string
}): Promise<{ ok: true } | Fail> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  if (!/^own\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(input.path)) {
    return { ok: false, error: "Invalid upload path." }
  }
  const scene: Scene = (SCENES as string[]).includes(input.scene) ? (input.scene as Scene) : "other"
  const { data: pub } = auth.supabase.storage.from(CONTENT_SOURCES_BUCKET).getPublicUrl(input.path)

  const { error } = await auth.supabase.from("content_sources").insert({
    kind: "own",
    scene,
    storage_path: input.path,
    public_url: pub.publicUrl,
    license: "Owned by Renderspace (KeSean Fallon)",
    notes: input.notes?.slice(0, 300) || null,
    status: "ready",
    created_by: auth.email,
  })
  if (error) return { ok: false, error: "Uploaded, but could not save the photo record." }

  revalidatePath("/admin/content")
  return { ok: true }
}

export async function setContentSourceStatus(formData: FormData): Promise<void> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return
  const id = String(formData.get("id") ?? "")
  const status = formData.get("status") === "rejected" ? "rejected" : "ready"
  if (!/^[0-9a-f-]{36}$/.test(id)) return
  await auth.supabase.from("content_sources").update({ status }).eq("id", id)
  revalidatePath("/admin/content")
}

export async function runContentRendersNow(): Promise<{ ok: true; summary: RunSummary } | Fail> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  const summary = await runContentRenders(auth.supabase, 240_000)
  revalidatePath("/admin/content")
  return { ok: true, summary }
}
