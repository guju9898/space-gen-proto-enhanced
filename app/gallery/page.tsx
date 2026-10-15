import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site/SiteHeader"
import { ChevronRight } from "lucide-react"
import { SiteFooter } from "@/components/site/SiteFooter"

export const metadata: Metadata = pageMetadata({
  path: "/gallery",
  title: "Before-and-After AI Rendering Gallery",
  description:
    "Real Renderspace outputs, no stock photos: before-and-after concepts for living rooms, kitchens, bedrooms, house exteriors and outdoor spaces from photos.",
})

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active="gallery" />

      {/* Gallery Hero */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white text-center">Explore designs from the Renderspace community</h1>
        <p className="text-muted-foreground text-center mb-12">All images below are real Renderspace outputs—no stock photos.</p>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-1.jpg"
              alt="Living room before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-2.jpg"
              alt="Living room after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 2 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-3.jpg"
              alt="House exterior before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-4.jpg"
              alt="House exterior after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 3 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-5.jpg"
              alt="Patio before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-6.jpg"
              alt="Patio after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 4 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-7.jpg"
              alt="Office before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-8.jpg"
              alt="Office after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 5 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-9.jpg"
              alt="Kitchen before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-10.jpg"
              alt="Kitchen after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 6 */}
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-11.jpg"
              alt="Bedroom before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/gallery/replace-12.jpg"
              alt="Bedroom after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

        {/* Load More Button */}
        <div className="flex justify-center mt-12">
          <button className="bg-[#191f33] hover:bg-[#232a45] text-white px-6 py-3 rounded-md font-medium transition-colors">
            Load More Designs
          </button>
        </div>
      </section>

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
              src="/gallery/replace-13.jpg"
              alt="Modern living room design"
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
