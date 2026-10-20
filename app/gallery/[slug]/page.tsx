import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { JsonLd } from "@/components/seo/JsonLd"
import { getPublishedRender } from "@/lib/content/gallery"
import { PresetStudioButton } from "@/components/gallery/PresetStudioButton"
import { presetForPublishedRender } from "@/lib/gallery/presets"
import { pageMetadata } from "@/lib/seo/metadata"
import { ORG_ID } from "@/lib/seo/schema"
import { PLANS, SITE, usd } from "@/lib/seo/facts"

export const revalidate = 3600

type Params = Promise<{ slug: string }>

function metaDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length <= 155 ? clean : clean.slice(0, 152).replace(/\s+\S*$/, "") + "…"
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const render = await getPublishedRender(slug)
  if (!render) return { title: "Concept not found", robots: { index: false, follow: true } }
  const base = pageMetadata({
    path: `/gallery/${render.slug}`,
    title: `${render.title}: AI Concept Rendering`,
    description: metaDescription(render.description),
  })
  return {
    ...base,
    openGraph: { ...base.openGraph, images: [{ url: render.imageUrl, alt: render.altText }] },
    twitter: { ...base.twitter, images: [render.imageUrl] },
  }
}

export default async function GalleryRenderPage({ params }: { params: Params }) {
  const { slug } = await params
  const render = await getPublishedRender(slug)
  if (!render) notFound()

  const preset = presetForPublishedRender({
    slug: render.slug,
    title: render.title,
    description: render.description,
    region: render.region,
    tags: render.tags,
    publishedAt: render.publishedAt,
    conceptKey: render.conceptKey,
    renderType: render.renderType,
    details: render.details,
  })

  const url = `${SITE.url}/gallery/${render.slug}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${url}#image`,
    name: render.title,
    contentUrl: render.imageUrl,
    url,
    caption: render.altText,
    description: render.description,
    keywords: render.tags.join(", "),
    datePublished: render.publishedAt,
    creator: { "@id": ORG_ID },
    copyrightHolder: { "@id": ORG_ID },
    creditText: "Renderspace",
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <SiteHeader active="gallery" />

      <main className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link href="/gallery" className="hover:text-white">Gallery</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{render.title}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{render.title}</h1>
        <p className="text-muted-foreground mb-8">
          {render.before
            ? render.before.kind === "own"
              ? "A Renderspace concept made from a job-site photo."
              : "A Renderspace concept made from a stock photo of an ordinary space."
            : "A Renderspace concept made from a short text brief."}
          {render.region ? ` Styled for ${render.region}.` : ""}
        </p>

        <div className={render.before ? "grid gap-4 md:grid-cols-2" : ""}>
          {render.before && (
            <figure>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#343434]">
                <Image
                  src={render.before.url}
                  alt={`Before: the original photo used for the ${render.title.toLowerCase()} concept`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="text-xs text-muted-foreground mt-2">
                Before{render.before.credit ? ` · ${render.before.credit}` : ""}
              </figcaption>
            </figure>
          )}
          <figure>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#343434]">
              <Image
                src={render.imageUrl}
                alt={render.altText}
                fill
                priority
                sizes={render.before ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 1024px, 100vw"}
                className="object-cover"
              />
            </div>
            <figcaption className="text-xs text-muted-foreground mt-2">After · Renderspace concept rendering</figcaption>
          </figure>
        </div>

        <section className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-3">About this design</h2>
            <p className="text-muted-foreground leading-relaxed">{render.description}</p>
            {render.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-5" aria-label="Topics">
                {render.tags.map((t) => (
                  <li key={t} className="text-xs rounded-full border border-[#343434] px-3 py-1 text-muted-foreground">
                    {t}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground mt-6">
              Concept rendering for visualization only. Not a construction drawing, engineering document or permit set.
            </p>
          </div>
          <aside className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-5">
            <h2 className="text-lg font-semibold text-white mb-2">See this on your own job</h2>
            {preset && (
              <div className="mb-4">
                <PresetStudioButton preset={preset} />
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              Snap a photo of your client&apos;s space and get concepts like this in about 30 seconds, before you quote.
            </p>
            <Link
              href="/onboarding?plan=starter"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Try 40 credits for {usd(PLANS.starter.priceUsd)} <ChevronRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Rather have it done for you? <Link href="/human-polish" className="underline">Human Polish</Link>.
            </p>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
