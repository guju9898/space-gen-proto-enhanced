import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site/SiteHeader"
import { ChevronRight } from "lucide-react"
import { SiteFooter } from "@/components/site/SiteFooter"
import { listPublishedRenders } from "@/lib/content/gallery"
import { GalleryDiscovery } from "@/components/gallery/GalleryDiscovery"

// New renders are published from the admin page; refresh the list hourly.
export const revalidate = 3600

export const metadata: Metadata = pageMetadata({
  path: "/gallery",
  title: "Before-and-After AI Rendering Gallery",
  description:
    "Real Renderspace outputs: before-and-after concepts for pools, patios, outdoor kitchens, landscapes, house exteriors and interiors, made from photos in about 30 seconds.",
})

export default async function GalleryPage() {
  const fresh = await listPublishedRenders(48)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active="gallery" />

      {/* Gallery Hero */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white text-center">Before-and-After AI Renderings Made in Renderspace</h1>
        <p className="text-muted-foreground text-center mb-12">Every concept below is a real Renderspace output. Source photos are labeled.</p>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/modern-limestone-house-olive-trees-courtyard-concept.jpg"
              alt="Concept rendering of a modern limestone house with olive trees, terracotta urns and a gravel front courtyard"
              width={600}
              height={400}
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/brick-house-entry-lanterns-night-concept.jpg"
              alt="Night concept rendering of a symmetrical brick house entry with lit lanterns, clay pots and a flagstone walk"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 2 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/modern-infill-townhouse-stone-wood-concept.jpg"
              alt="Concept rendering of a modern infill townhouse with stone and wood cladding between city high-rises"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/corner-house-wood-concrete-cladding-concept.jpg"
              alt="Concept rendering of a three-story corner house with wood and concrete panel cladding and street planting"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 3 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/open-plan-living-room-gray-sectional-concept.jpg"
              alt="Interior concept rendering of an open-plan living room with a gray sectional, oak staircase and modern kitchen"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/single-story-limestone-house-gravel-forecourt-concept.jpg"
              alt="Concept rendering of a single-story limestone house with a wood front door and a gravel forecourt"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 4 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/garden-tiered-fountain-hammock-deck-concept.jpg"
              alt="Garden concept rendering with a tiered stone fountain, stepping-stone paths, dense planting and a hammock deck"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/backyard-deck-pergola-hammock-concept.jpg"
              alt="Backyard concept rendering with a wood deck, pergola, hammock, raised planters and white flowering beds"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

      </section>

      <GalleryDiscovery renders={fresh} />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-orange-500/20 to-violet-700/20 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Ready to transform your space?</h2>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Start your own design journey today</h3>
            <p className="text-muted-foreground mb-6">
              See how Renderspace helps you visualize and create client-ready concepts in minutes.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-6 py-3 rounded-md font-medium"
            >
              Try It Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/gallery/single-story-limestone-house-gravel-forecourt-concept.jpg"
              alt="Concept rendering of a single-story limestone house with a wood front door and a gravel forecourt"
              width={500}
              height={300}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
