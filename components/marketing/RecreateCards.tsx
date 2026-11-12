import Image from "next/image"
import Link from "next/link"
import { studioPresetHref } from "@/lib/gallery/presets"

/**
 * "Recreate this" cards (homepage). Images are Renderspace's own concept renders, never
 * customer uploads. Cards with a Gallery preset open the demo Studio with that design
 * loaded; the others open the matching Studio, and say so.
 */
type Card = {
  title: string
  trade: string
  image: string
  alt: string
  href: string
  preset: boolean
}

const CARDS: Card[] = [
  {
    title: "Pool and stone deck",
    trade: "Pools",
    image: "/landing/renders/exterior-hero-01.jpg",
    alt: "Renderspace concept of a limestone home with a lap pool and stone pool deck",
    href: studioPresetHref({ category: "landscape", slug: "pool-hardscape-transformation" }, { demo: true }),
    preset: true,
  },
  {
    title: "Cedar pergola and outdoor kitchen",
    trade: "Outdoor living",
    image: "/gallery/backyard-deck-pergola-hammock-concept.jpg",
    alt: "Renderspace concept of a backyard wood deck with a pergola",
    href: studioPresetHref({ category: "landscape", slug: "cedar-pergola-outdoor-kitchen" }, { demo: true }),
    preset: true,
  },
  {
    title: "Classical garden with fountain",
    trade: "Landscaping",
    image: "/gallery/garden-tiered-fountain-hammock-deck-concept.jpg",
    alt: "Renderspace garden concept with a tiered stone fountain",
    href: studioPresetHref({ category: "landscape", slug: "classical-dallas-landscape" }, { demo: true }),
    preset: true,
  },
  {
    title: "Limestone courtyard home",
    trade: "Exteriors",
    image: "/gallery/modern-limestone-house-olive-trees-courtyard-concept.jpg",
    alt: "Renderspace concept of a modern limestone house with olive trees in a courtyard",
    href: "/studio/exterior?demo=true",
    preset: false,
  },
  {
    title: "Wood and concrete facade",
    trade: "Exteriors",
    image: "/gallery/corner-house-wood-concrete-cladding-concept.jpg",
    alt: "Renderspace concept of a corner house with wood and concrete cladding",
    href: "/studio/exterior?demo=true",
    preset: false,
  },
  {
    title: "Open-plan living room",
    trade: "Interiors",
    image: "/gallery/open-plan-living-room-gray-sectional-concept.jpg",
    alt: "Renderspace concept of an open-plan living room with a gray sectional",
    href: "/studio/interior?demo=true",
    preset: false,
  },
]

export function RecreateCards() {
  return (
    <section className="container mx-auto px-4 py-16" aria-labelledby="recreate-heading">
      <h2 id="recreate-heading" className="text-2xl md:text-3xl font-bold mb-3 text-white text-center">
        Start from a design you like
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-center">
        Pick a look, add your client&apos;s photo, and render it in the free demo.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {CARDS.map((card) => (
          <li key={card.title} className="group overflow-hidden rounded-xl border border-[#343434] bg-[#191f33]/50">
            <Link href={card.href} className="block">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#191f33]">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white">{card.trade}</span>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <span className="font-medium text-white">{card.title}</span>
                <span className="shrink-0 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white group-hover:border-orange-400 group-hover:text-orange-300">
                  {card.preset ? "Recreate this" : "Start a design like this"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-4 text-center">All images generated in Renderspace</p>
    </section>
  )
}
