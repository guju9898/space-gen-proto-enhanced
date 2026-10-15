/**
 * Daily content render run (server-only).
 *
 *   1. ingestStockSources  – download stock photos queued by the bots into our bucket
 *   2. ensureTodayPlan     – top today's job list up to the daily target
 *   3. runQueuedJobs       – render queued jobs through the same Gemini/OpenRouter
 *                            pipeline the Exterior/Landscape studios use
 *
 * Called by the Vercel cron (/api/cron/content-renders) and the admin "Run now"
 * action. Never reads customer uploads.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { generateImageFromOpenRouter } from "@/lib/api/generateImageFromOpenRouter"
import {
  chicagoDate,
  isAllowedStockUrl,
  planJobs,
  type Scene,
  type SourceForPlan,
} from "@/lib/content/concepts"

export const CONTENT_SOURCES_BUCKET = "content-sources"
export const DAILY_RENDER_TARGET = 18
const MAX_STOCK_BYTES = 10 * 1024 * 1024
const CONCURRENCY = 4

export type RunSummary = {
  date: string
  ingested: number
  ingestFailed: number
  planned: number
  rendered: number
  failed: number
  stillQueued: number
  errors: string[]
}

export async function ingestStockSources(
  supabase: SupabaseClient,
  limit = 10
): Promise<{ ingested: number; failed: number; errors: string[] }> {
  const errors: string[] = []
  let ingested = 0
  let failed = 0

  const { data: rows, error } = await supabase
    .from("content_sources")
    .select("id, source_url")
    .eq("status", "pending_ingest")
    .order("created_at", { ascending: true })
    .limit(limit)
  if (error) return { ingested, failed, errors: [`ingest query: ${error.message}`] }

  for (const row of rows ?? []) {
    const reject = async (reason: string) => {
      failed++
      errors.push(`ingest ${row.id}: ${reason}`)
      await supabase
        .from("content_sources")
        .update({ status: "rejected", notes: `Ingest failed: ${reason}` })
        .eq("id", row.id)
    }

    if (!row.source_url || !isAllowedStockUrl(row.source_url)) {
      await reject("source host not allowed")
      continue
    }
    try {
      const res = await fetch(row.source_url, { redirect: "follow" })
      const type = res.headers.get("content-type") ?? ""
      if (!res.ok || !type.startsWith("image/")) {
        await reject(`download returned ${res.status} ${type}`)
        continue
      }
      const bytes = new Uint8Array(await res.arrayBuffer())
      if (bytes.byteLength > MAX_STOCK_BYTES) {
        await reject("file larger than 10 MB")
        continue
      }
      const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg"
      const path = `stock/${row.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(CONTENT_SOURCES_BUCKET)
        .upload(path, bytes, { contentType: type, upsert: true })
      if (upErr) {
        await reject(`upload: ${upErr.message}`)
        continue
      }
      const { data: pub } = supabase.storage.from(CONTENT_SOURCES_BUCKET).getPublicUrl(path)
      await supabase
        .from("content_sources")
        .update({ status: "ready", storage_path: path, public_url: pub.publicUrl })
        .eq("id", row.id)
      ingested++
    } catch (e) {
      await reject(e instanceof Error ? e.message : "download failed")
    }
  }
  return { ingested, failed, errors }
}

export async function ensureTodayPlan(
  supabase: SupabaseClient,
  date: string,
  target = DAILY_RENDER_TARGET
): Promise<{ planned: number; error?: string }> {
  const { count, error: countErr } = await supabase
    .from("content_render_jobs")
    .select("id", { count: "exact", head: true })
    .eq("batch_date", date)
  if (countErr) return { planned: 0, error: `plan count: ${countErr.message}` }

  const existing = count ?? 0
  const missing = target - existing
  if (missing <= 0) return { planned: 0 }

  const { data: sourceRows } = await supabase
    .from("content_sources")
    .select("id, kind, scene, times_used")
    .eq("status", "ready")
    .not("public_url", "is", null)
    .limit(200)

  const sources: SourceForPlan[] = (sourceRows ?? []).map((r) => ({
    id: r.id as string,
    kind: r.kind === "own" ? "own" : "stock",
    scene: r.scene as Scene,
    timesUsed: Number(r.times_used ?? 0),
  }))

  // Editor bot's guidance (optional): concept keys to boost or avoid.
  const { data: guide } = await supabase
    .from("content_render_guidance")
    .select("boost_keys, avoid_keys, photo_share")
    .eq("id", 1)
    .maybeSingle()

  const jobs = planJobs({
    date,
    count: missing,
    sources,
    startIndex: existing,
    boostKeys: (guide?.boost_keys as string[] | null) ?? [],
    avoidKeys: (guide?.avoid_keys as string[] | null) ?? [],
    photoShare: typeof guide?.photo_share === "number" ? guide.photo_share : undefined,
  })

  const { error } = await supabase.from("content_render_jobs").insert(
    jobs.map((j) => ({
      batch_date: date,
      concept_key: j.conceptKey,
      render_type: j.renderType,
      source_id: j.sourceId,
      prompt: j.prompt,
      title: j.title,
      alt_text: j.altText,
      caption: j.caption,
      slug: j.slug,
      region: j.region,
      created_by: "auto",
    }))
  )
  if (error) return { planned: 0, error: `plan insert: ${error.message}` }
  return { planned: jobs.length }
}

type JobRow = {
  id: string
  batch_date: string
  render_type: "landscape" | "exterior" | "interior"
  prompt: string
  slug: string | null
  source_id: string | null
  attempts: number
}

async function runOne(supabase: SupabaseClient, job: JobRow): Promise<"done" | "failed" | "skipped"> {
  // Claim it (another run may have taken it).
  const { data: claimed } = await supabase
    .from("content_render_jobs")
    .update({ status: "running", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id")
  if (!claimed?.length) return "skipped"

  let image: string | null = null
  if (job.source_id) {
    const { data: src } = await supabase
      .from("content_sources")
      .select("public_url, status, times_used")
      .eq("id", job.source_id)
      .maybeSingle()
    if (!src?.public_url || src.status !== "ready") {
      await supabase
        .from("content_render_jobs")
        .update({ status: "failed", error: "source photo missing or rejected", finished_at: new Date().toISOString() })
        .eq("id", job.id)
      return "failed"
    }
    image = src.public_url as string
    await supabase
      .from("content_sources")
      .update({ times_used: Number(src.times_used ?? 0) + 1, last_used_at: new Date().toISOString() })
      .eq("id", job.source_id)
  }

  const filePath = `content/${job.batch_date}/${job.slug ?? job.id}-${job.id.slice(0, 6)}.png`
  const url = await generateImageFromOpenRouter({
    prompt: job.prompt,
    image,
    renderType: job.render_type === "landscape" ? "landscape" : "exterior",
    filePath,
  })

  if (!url) {
    await supabase
      .from("content_render_jobs")
      .update({ status: "failed", error: "generation returned no image", finished_at: new Date().toISOString() })
      .eq("id", job.id)
    return "failed"
  }

  await supabase
    .from("content_render_jobs")
    .update({
      status: "done",
      result_url: url,
      storage_path: url.includes(filePath) ? filePath : null,
      error: null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", job.id)
  return "done"
}

export async function runQueuedJobs(
  supabase: SupabaseClient,
  options: { date: string; deadlineMs: number; max?: number }
): Promise<{ rendered: number; failed: number; stillQueued: number; error?: string }> {
  const { data, error } = await supabase
    .from("content_render_jobs")
    .select("id, batch_date, render_type, prompt, slug, source_id, attempts")
    .eq("status", "queued")
    .lte("batch_date", options.date)
    .lt("attempts", 3)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(options.max ?? 40)
  if (error) return { rendered: 0, failed: 0, stillQueued: 0, error: `jobs query: ${error.message}` }

  const queue = [...((data ?? []) as JobRow[])]
  let rendered = 0
  let failed = 0

  const worker = async () => {
    while (queue.length && Date.now() < options.deadlineMs) {
      const job = queue.shift()!
      try {
        const result = await runOne(supabase, job)
        if (result === "done") rendered++
        if (result === "failed") failed++
      } catch (e) {
        failed++
        await supabase
          .from("content_render_jobs")
          .update({
            status: "failed",
            error: e instanceof Error ? e.message.slice(0, 300) : "unexpected error",
            finished_at: new Date().toISOString(),
          })
          .eq("id", job.id)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  return { rendered, failed, stillQueued: queue.length }
}

/** Full daily run with a time budget (ms) so it finishes inside the function limit. */
export async function runContentRenders(
  supabase: SupabaseClient,
  budgetMs = 240_000
): Promise<RunSummary> {
  const started = Date.now()
  const date = chicagoDate()
  const errors: string[] = []

  // Jobs stuck in "running" for over 15 minutes (a crashed run) go back to the queue.
  await supabase
    .from("content_render_jobs")
    .update({ status: "queued" })
    .eq("status", "running")
    .lt("started_at", new Date(Date.now() - 15 * 60_000).toISOString())

  const ingest = await ingestStockSources(supabase)
  errors.push(...ingest.errors)

  const plan = await ensureTodayPlan(supabase, date)
  if (plan.error) errors.push(plan.error)

  const run = await runQueuedJobs(supabase, { date, deadlineMs: started + budgetMs })
  if (run.error) errors.push(run.error)

  return {
    date,
    ingested: ingest.ingested,
    ingestFailed: ingest.failed,
    planned: plan.planned,
    rendered: run.rendered,
    failed: run.failed,
    stillQueued: run.stillQueued,
    errors: errors.slice(0, 10),
  }
}
