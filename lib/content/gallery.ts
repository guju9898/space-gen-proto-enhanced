/**
 * Published content renders for the public gallery (server-only reads).
 * Only rows KeSean approved (published = true) are ever returned.
 */

import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"

export type GalleryRender = {
  id: string
  slug: string
  title: string
  altText: string
  caption: string | null
  description: string
  imageUrl: string
  region: string | null
  tags: string[]
  publishedAt: string
  conceptKey: string | null
  renderType: "interior" | "exterior" | "landscape" | null
  details: { slot?: string; text?: string; short?: string }[]
  before: { url: string; kind: "own" | "stock"; credit: string | null } | null
}

const COLUMNS =
  "id, public_slug, title, alt_text, caption, description, result_url, region, tags, published_at, concept_key, render_type, details, source:content_sources(kind, public_url, credit)"

type Row = {
  id: string
  public_slug: string | null
  title: string | null
  alt_text: string | null
  caption: string | null
  description: string | null
  result_url: string | null
  region: string | null
  tags: string[] | null
  published_at: string | null
  concept_key: string | null
  render_type: string | null
  details: unknown
  source: { kind: string; public_url: string | null; credit: string | null } | { kind: string; public_url: string | null; credit: string | null }[] | null
}

function asDetails(value: unknown): GalleryRender["details"] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const row = item as { slot?: unknown; text?: unknown; short?: unknown }
    return [{
      slot: typeof row.slot === "string" ? row.slot : undefined,
      text: typeof row.text === "string" ? row.text : undefined,
      short: typeof row.short === "string" ? row.short : undefined,
    }]
  })
}

function asRenderType(value: string | null): GalleryRender["renderType"] {
  if (value === "interior" || value === "exterior" || value === "landscape") return value
  return null
}

function toRender(r: Row): GalleryRender | null {
  if (!r.public_slug || !r.result_url || !r.title || !r.description) return null
  const src = Array.isArray(r.source) ? r.source[0] : r.source
  return {
    id: r.id,
    slug: r.public_slug,
    title: r.title,
    altText: r.alt_text || r.title,
    caption: r.caption,
    description: r.description,
    imageUrl: r.result_url,
    region: r.region,
    tags: r.tags ?? [],
    publishedAt: r.published_at ?? new Date().toISOString(),
    conceptKey: r.concept_key,
    renderType: asRenderType(r.render_type),
    details: asDetails(r.details),
    before:
      src?.public_url && (src.kind === "own" || src.kind === "stock")
        ? { url: src.public_url, kind: src.kind, credit: src.credit }
        : null,
  }
}

export async function listPublishedRenders(limit = 48): Promise<GalleryRender[]> {
  const supabase = getHumanPolishSupabaseService()
  if (!supabase) return []
  const { data, error } = await supabase
    .from("content_render_jobs")
    .select(COLUMNS)
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return (data as unknown as Row[]).map(toRender).filter((r): r is GalleryRender => r !== null)
}

export async function getPublishedRender(slug: string): Promise<GalleryRender | null> {
  if (!/^[a-z0-9-]{3,90}$/.test(slug)) return null
  const supabase = getHumanPolishSupabaseService()
  if (!supabase) return null
  const { data } = await supabase
    .from("content_render_jobs")
    .select(COLUMNS)
    .eq("published", true)
    .eq("public_slug", slug)
    .maybeSingle()
  return data ? toRender(data as unknown as Row) : null
}
