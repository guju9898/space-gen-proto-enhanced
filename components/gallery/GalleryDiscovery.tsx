"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { trackGalleryEvent } from "@/components/gallery/analytics"
import { PresetStudioButton } from "@/components/gallery/PresetStudioButton"
import {
  hasMeasuredPopularity,
  listGalleryPresets,
  presetForPublishedRender,
  type DesignPreset,
  type StudioCategory,
} from "@/lib/gallery/presets"

export type GalleryDiscoveryRender = {
  id: string
  slug: string
  title: string
  altText: string
  description: string
  imageUrl: string
  region: string | null
  tags: string[]
  publishedAt: string
  conceptKey: string | null
  renderType: StudioCategory | null
  details: { slot?: string; text?: string; short?: string }[]
  before: { kind: "own" | "stock" } | null
}

const FILTERS: { id: "all" | StudioCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "landscape", label: "Landscape" },
  { id: "exterior", label: "Exterior" },
  { id: "interior", label: "Interior" },
]

function haystack(parts: Array<string | null | undefined | string[]>): string {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ")
    .toLowerCase()
}

function matches(text: string, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return text.includes(needle)
}

function PresetCard({ preset }: { preset: DesignPreset }) {
  return (
    <article className="flex flex-col rounded-xl overflow-hidden border border-[#343434] bg-[#101010]">
      <Link href={`/gallery/looks/${preset.slug}`} className="group block">
        {preset.referenceImage ? (
          <div className="relative aspect-[4/3]">
            <Image
              src={preset.referenceImage.src}
              alt={preset.referenceImage.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-[#191f33] flex items-end p-4">
            <p className="text-sm text-muted-foreground">Style reference. No project photo is attached.</p>
          </div>
        )}
        <div className="p-4 pb-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {preset.featured && (
              <span className="text-[11px] uppercase tracking-wide text-primary">Featured</span>
            )}
            {preset.isNew && (
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">New</span>
            )}
            {hasMeasuredPopularity(preset) && (
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Popular</span>
            )}
          </div>
          <h3 className="text-white font-semibold">{preset.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{preset.style} · {preset.category}</p>
        </div>
      </Link>
      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        <ul className="flex flex-wrap gap-2" aria-label="Materials and features">
          {[...preset.materials, ...preset.features].slice(0, 4).map((tag) => (
            <li key={tag} className="text-xs rounded-full border border-[#343434] px-3 py-1 text-muted-foreground">
              {tag}
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <PresetStudioButton preset={preset} />
        </div>
      </div>
    </article>
  )
}

export function GalleryDiscovery({ renders }: { renders: GalleryDiscoveryRender[] }) {
  const catalog = listGalleryPresets()
  const [filter, setFilter] = useState<"all" | StudioCategory>("all")
  const [query, setQuery] = useState("")
  const skipFilterEvent = useRef(true)

  useEffect(() => {
    trackGalleryEvent("gallery_viewed")
  }, [])

  useEffect(() => {
    if (skipFilterEvent.current) {
      skipFilterEvent.current = false
      return
    }
    trackGalleryEvent("gallery_filter_applied", {
      filter,
      has_query: query.trim() ? "1" : "0",
    })
  }, [filter, query])

  const published = useMemo(
    () => renders.map((render) => ({ render, preset: presetForPublishedRender(render) })),
    [renders]
  )

  const visiblePresets = catalog.filter((preset) => {
    if (filter !== "all" && preset.category !== filter) return false
    return matches(
      haystack([preset.title, preset.description, preset.style, preset.tags, preset.materials, preset.features, preset.regions]),
      query
    )
  })

  const browsing = !query.trim() && filter === "all"
  const featured = browsing ? visiblePresets.filter((preset) => preset.featured) : []
  const freshNew = browsing ? visiblePresets.filter((preset) => preset.isNew && !preset.featured) : []
  const popular = visiblePresets.filter(hasMeasuredPopularity)
  const rest = browsing
    ? visiblePresets.filter((preset) => !preset.featured && !preset.isNew && !hasMeasuredPopularity(preset))
    : visiblePresets

  const visibleRenders = published.filter(({ render }) => {
    if (filter !== "all" && render.renderType !== filter) return false
    return matches(haystack([render.title, render.description, render.tags, render.region]), query)
  })

  return (
    <section className="container mx-auto px-4 py-12" aria-labelledby="design-library">
      <h2 id="design-library" className="text-2xl md:text-3xl font-bold mb-2 text-white text-center">
        Design library
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
        Start from a look, then change any setting and upload a photo of your own property.
      </p>

      <div className="max-w-3xl mx-auto mb-6">
        <label htmlFor="gallery-search" className="sr-only">Search designs</label>
        <input
          id="gallery-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search styles, materials, or regions"
          className="w-full rounded-md border border-[#343434] bg-[#101010] px-4 py-3 text-sm text-white"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-10" role="group" aria-label="Design category">
        {FILTERS.map((item) => {
          const selected = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-full text-sm border ${
                selected
                  ? "border-primary text-white bg-primary/20"
                  : "border-[#343434] text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {popular.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4">Popular</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popular.map((preset) => (
              <li key={`popular-${preset.id}`}>
                <PresetCard preset={preset} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {featured.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4">Featured</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((preset) => (
              <li key={`featured-${preset.id}`}>
                <PresetCard preset={preset} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {freshNew.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4">New</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {freshNew.map((preset) => (
              <li key={`new-${preset.id}`}>
                <PresetCard preset={preset} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {rest.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-white mb-4">{browsing ? "All starting points" : "Starting points"}</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {rest.map((preset) => (
              <li key={preset.id}>
                <PresetCard preset={preset} />
              </li>
            ))}
          </ul>
        </>
      )}
      {visiblePresets.length === 0 && (
        <p className="text-sm text-muted-foreground mb-10">No starting points match that search.</p>
      )}

      {(renders.length > 0 || query.trim() || filter !== "all") && (
      <>
      <h3 id="fresh-concepts" className="text-lg font-semibold text-white mb-2">
        Fresh concepts from Renderspace
      </h3>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Pool, patio, outdoor kitchen, landscape and exterior ideas made with Renderspace. Open any design to see the
        source photo, the materials and how the space would work.
      </p>
      {visibleRenders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published concepts match that search.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleRenders.map(({ render, preset }) => (
            <li key={render.id} className="flex flex-col rounded-xl overflow-hidden border border-[#343434] bg-[#101010]">
              <Link href={`/gallery/${render.slug}`} className="group block">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={render.imageUrl}
                    alt={render.altText}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold">{render.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {render.before
                      ? render.before.kind === "own"
                        ? "From a job-site photo"
                        : "From a stock photo"
                      : "Concept from a text brief"}
                    {render.region ? ` · ${render.region}` : ""}
                  </p>
                </div>
              </Link>
              {preset && (
                <div className="px-4 pb-4">
                  <PresetStudioButton preset={preset} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      </>
      )}
    </section>
  )
}
