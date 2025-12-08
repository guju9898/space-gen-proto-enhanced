import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Menu } from "lucide-react"

export default function GalleryPage() {
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
          <Link href="/auth/sign-in" className="text-sm text-white hover:text-primary/90">
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
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-white text-center">Explore User Latest Designs</h1>

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

          {/* Row 2 */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Before</div>
            <Image
              src="/gallery/exterior-before.jpg"
              alt="House exterior before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">After</div>
            <Image
              src="/gallery/exterior-after.jpg"
              alt="House exterior after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 3 */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Before</div>
            <Image
              src="/gallery/patio-before.jpg"
              alt="Patio before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">After</div>
            <Image
              src="/gallery/patio-after.jpg"
              alt="Patio after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 4 */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Before</div>
            <Image
              src="/gallery/office-before.jpg"
              alt="Office before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">After</div>
            <Image
              src="/gallery/office-after.jpg"
              alt="Office after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 5 */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Before</div>
            <Image
              src="/gallery/kitchen-before.jpg"
              alt="Kitchen before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">After</div>
            <Image
              src="/gallery/kitchen-after.jpg"
              alt="Kitchen after redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Row 6 */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Before</div>
            <Image
              src="/gallery/bedroom-before.jpg"
              alt="Bedroom before redesign"
              width={600}
              height={400}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">After</div>
            <Image
              src="/gallery/bedroom-after.jpg"
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
        <div className="bg-gradient-to-r from-[#9747ff]/20 to-[#8608fd]/20 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Ready to transform your space?</h2>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Start your own design journey today!</h3>
            <p className="text-muted-foreground mb-6">
              See how AI can help you visualize and create your dream space in minutes.
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9747ff] to-[#8608fd] hover:opacity-90 text-white px-6 py-3 rounded-md font-medium"
            >
              Try It Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/gallery/cta-image.jpg"
              alt="Modern living room design"
              width={500}
              height={300}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#101010] border-t border-[#343434] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image src="/amethyst-flow.png" alt="Space Gen Logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-bold text-lg text-white">Space Gen</span>
            </div>

            <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
              <Link href="#privacy" className="text-sm text-muted-foreground hover:text-white">
                Privacy Policy
              </Link>
              <Link href="#terms" className="text-sm text-muted-foreground hover:text-white">
                Terms of Service
              </Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-white">
                About
              </Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-white">
                Contact
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

            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>© 2023 Space Gen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
