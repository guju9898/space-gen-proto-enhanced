import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import FilterBar from "../components/filter-bar"

export default function GalleryPageWithFilters() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/amethyst-flow.png" alt="Space Gen Logo" width={32} height={32} className="w-8 h-8" />
          <span className="font-bold text-lg text-white">Space Gen</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {/* TODO: change href to /about when implemented */}
          <Link href="#" className="text-sm text-muted-foreground hover:text-white">
            About
          </Link>
          <Link href="/gallery" className="text-sm text-white hover:text-primary/90">
            Gallery
          </Link>
          <Link href="/my-renders" className="text-sm text-muted-foreground hover:text-white">
            My Renders
          </Link>
          {/* TODO: change href to /pricing when implemented */}
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">
            Pricing
          </Link>
          {/* TODO: create /faq page */}
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-white">
            FAQ
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-white hover:text-primary/90">
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="text-sm bg-gradient-to-r from-[#9747ff] to-[#8608fd] hover:opacity-90 text-white px-4 py-2 rounded-md"
          >
            Redesign now
          </Link>
        </div>

        <button className="md:hidden text-white">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Gallery Hero */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white text-center">Explore User Latest Designs</h1>

        {/* Filter Bar */}
        <FilterBar />

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1 */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Before</div>
            <Image
              src="/gallery/living-room-before.jpg"
              alt="Living room before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">After</div>
            <Image
              src="/gallery/living-room-after.jpg"
              alt="Living room after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Additional rows would be the same as in the basic gallery page */}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center mt-12">
          <button className="bg-[#191f33] hover:bg-[#232a45] text-white px-6 py-3 rounded-md font-medium transition-colors">
            Load More Designs
          </button>
        </div>
      </section>

      {/* Footer would be the same as in the basic gallery page */}
    </div>
  )
}
