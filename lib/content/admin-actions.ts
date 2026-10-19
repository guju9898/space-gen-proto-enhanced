"use server"

import { revalidatePath } from "next/cache"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import { SCENES, type Scene } from "@/lib/content/concepts"
import {
  CONTENT_SOURCES_BUCKET,
  describeOne,
  describePending,
  runContentRenders,
  runExtraRenders,
  type DescribeJob,
  type RunSummary,
} from "@/lib/content/run"
import { publicSlugFor } from "@/lib/content/describe"

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

/**
 * "Run renders now". With extra = 0 it finishes today's normal batch (same as
 * the morning cron). With extra > 0 it also retries today's failed renders and
 * adds that many new ones, even when the morning batch is already complete.
 */
export async function runContentRendersNow(extra = 0): Promise<{ ok: true; summary: RunSummary } | Fail> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  const n = Number.isFinite(extra) ? Math.max(0, Math.min(Math.floor(extra), 12)) : 0
  const summary = n > 0 ? await runExtraRenders(auth.supabase, n, 200_000) : await runContentRenders(auth.supabase, 200_000)
  revalidatePath("/admin/content")
  return { ok: true, summary }
}

/** Publish or unpublish a finished render on the public gallery. */
export async function setRenderPublished(formData: FormData): Promise<void> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return
  const id = String(formData.get("id") ?? "")
  const publish = formData.get("publish") === "true"
  if (!/^[0-9a-f-]{36}$/.test(id)) return

  const { data: job } = await auth.supabase
    .from("content_render_jobs")
    .select("id, slug, title, status, description, public_slug")
    .eq("id", id)
    .maybeSingle()
  if (!job || job.status !== "done") return
  if (publish && !job.description) return // needs SEO text first

  await auth.supabase
    .from("content_render_jobs")
    .update(
      publish
        ? {
            published: true,
            published_at: new Date().toISOString(),
            public_slug: job.public_slug ?? publicSlugFor(job),
          }
        : { published: false }
    )
    .eq("id", id)
  revalidatePath("/admin/content")
  revalidatePath("/gallery")
  if (job.public_slug) revalidatePath(`/gallery/${job.public_slug}`)
}

type ActionResult = { ok: true; message: string } | Fail

const ID_RE = /^[0-9a-f-]{36}$/

/** Approve (publish to the gallery) or reject a finished render. Writes SEO text first if missing. */
export async function reviewRender(id: string, decision: "approve" | "reject" | "reset"): Promise<ActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!ID_RE.test(id)) return { ok: false, error: "Invalid render." }

  const { data: job } = await auth.supabase
    .from("content_render_jobs")
    .select("id, slug, title, status, description, public_slug, result_url, concept_key, region, source_id, details")
    .eq("id", id)
    .maybeSingle()
  if (!job || job.status !== "done" || !job.result_url) return { ok: false, error: "This render isn't finished." }

  if (decision === "reject" || decision === "reset") {
    await auth.supabase
      .from("content_render_jobs")
      .update({ review_status: decision === "reject" ? "rejected" : "pending", published: false })
      .eq("id", id)
    revalidatePath("/admin/content")
    revalidatePath("/gallery")
    if (job.public_slug) revalidatePath(`/gallery/${job.public_slug}`)
    return { ok: true, message: decision === "reject" ? "Rejected" : "Moved back to review" }
  }

  let title = job.title
  if (!job.description) {
    const r = await describeOne(auth.supabase, {
      id: job.id,
      result_url: job.result_url,
      concept_key: job.concept_key,
      region: job.region,
      source_id: job.source_id,
      details: job.details,
    })
    if (!r.ok) return { ok: false, error: `Couldn't write the SEO text: ${r.error ?? "unknown error"}` }
    const { data: fresh } = await auth.supabase.from("content_render_jobs").select("title").eq("id", id).maybeSingle()
    title = fresh?.title ?? title
  }

  const publicSlug = job.public_slug ?? publicSlugFor({ id: job.id, slug: job.slug, title })
  await auth.supabase
    .from("content_render_jobs")
    .update({ review_status: "approved", published: true, published_at: new Date().toISOString(), public_slug: publicSlug })
    .eq("id", id)
  revalidatePath("/admin/content")
  revalidatePath("/gallery")
  revalidatePath(`/gallery/${publicSlug}`)
  return { ok: true, message: "Published to the gallery" }
}

/** Write SEO text for one render without publishing it. */
export async function writeRenderSeoText(id: string): Promise<ActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!ID_RE.test(id)) return { ok: false, error: "Invalid render." }
  const { data: job } = await auth.supabase
    .from("content_render_jobs")
    .select("id, result_url, concept_key, region, source_id, status, details")
    .eq("id", id)
    .maybeSingle()
  if (!job || job.status !== "done" || !job.result_url) return { ok: false, error: "This render isn't finished." }
  const r = await describeOne(auth.supabase, job as DescribeJob)
  revalidatePath("/admin/content")
  return r.ok ? { ok: true, message: "SEO text written" } : { ok: false, error: r.error ?? "Couldn't write the SEO text." }
}

/** Write SEO text for every finished render that is still missing it (up to ~3 minutes). */
export async function writeAllRenderSeoText(): Promise<ActionResult> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  const n = await describePending(auth.supabase, { deadlineMs: Date.now() + 180_000, max: 60 })
  const { count } = await auth.supabase
    .from("content_render_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "done")
    .neq("review_status", "rejected")
    .is("described_at", null)
  revalidatePath("/admin/content")
  return { ok: true, message: `SEO text written for ${n} render${n === 1 ? "" : "s"}${count ? `; ${count} still missing (run again)` : ""}` }
}

/** Approve, reject or restore a source photo. Approved stock photos become usable by the render bot. */
export async function reviewSource(formData: FormData): Promise<void> {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) return
  const id = String(formData.get("id") ?? "")
  const decision = String(formData.get("decision") ?? "")
  if (!ID_RE.test(id)) return
  const status = decision === "approve" || decision === "restore" ? "ready" : decision === "reject" ? "rejected" : null
  if (!status) return
  await auth.supabase.from("content_sources").update({ status }).eq("id", id).not("public_url", "is", null)
  revalidatePath("/admin/content")
}
