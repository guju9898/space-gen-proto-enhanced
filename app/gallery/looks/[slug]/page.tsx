import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { PresetOpened } from "@/components/gallery/PresetOpened"
import { PresetStudioButton } from "@/components/gallery/PresetStudioButton"
import { pageMetadata } from "@/lib/seo/metadata"
import { resolveGalleryPreset } from "@/lib/gallery/presets"

export const revalidate = 3600

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const preset = resolveGalleryPreset(slug)
  if (!preset) return { title: "Design not found", robots: { index: false, follow: true } }
  return pageMetadata({
    path: `/gallery/looks/${preset.slug}`,
    title: `${preset.title}: Design starting point`,
    description: preset.description,
  })
}

export default async function GalleryLookPage({ params }: { params: Params }) {
  const { slug } = await params
  const preset = resolveGalleryPreset(slug)
  if (!preset) notFound()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PresetOpened slug={preset.slug} category={preset.category} />
      <SiteHeader active="gallery" />
      <main className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link href="/gallery" className="hover:text-white">Gallery</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{preset.title}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{preset.title}</h1>
        <p className="text-muted-foreground mb-8 max-w-3xl">{preset.description}</p>

        {preset.referenceImage ? (
          <figure>
            <div className="relative aspect-[4/3] max-w-3xl rounded-xl overflow-hidden border border-[#343434]">
              <Image
                src={preset.referenceImage.src}
                alt={preset.referenceImage.alt}
                fill
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="text-xs text-muted-foreground mt-2">
              Existing Renderspace concept, shown as a style reference. Not a finished client project.
            </figcaption>
          </figure>
        ) : (
          <p className="text-sm text-muted-foreground rounded-xl border border-[#343434] bg-[#191f33]/50 p-5 max-w-3xl">
            No reference photo is attached. This starting point only sets Studio controls and a design note you can edit.
          </p>
        )}

        <section className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-3">What comes with this look</h2>
            <ul className="flex flex-wrap gap-2" aria-label="Materials and features">
              {[preset.style, ...preset.materials, ...preset.features, ...preset.regions].map((tag) => (
                <li key={tag} className="text-xs rounded-full border border-[#343434] px-3 py-1 text-muted-foreground">
                  {tag}
                </li>
              ))}
            </ul>
            {preset.promptBrief && (
              <p className="text-muted-foreground leading-relaxed mt-5">{preset.promptBrief}</p>
            )}
          </div>
          <aside className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-5 h-fit">
            <h2 className="text-lg font-semibold text-white mb-2">Use it on your property</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Opens the {preset.category} Studio with these settings filled in. Upload your own photo and change anything.
            </p>
            <PresetStudioButton preset={preset} />
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
