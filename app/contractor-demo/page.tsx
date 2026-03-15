import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ExampleProject } from "@/components/demo/ExampleProject"
import { HowItWorks } from "@/components/demo/HowItWorks"
import { StudioPreview } from "@/components/demo/StudioPreview"
import { ConversionCTA } from "@/components/demo/ConversionCTA"

export default function ContractorDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/amethyst-flow.png"
              alt="Renderspace"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-bold text-lg text-white">Renderspace</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/mockup-method"
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Mock-Up Method
            </Link>
            <Link
              href="/studio/exterior?demo=true"
              className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-2 rounded-md"
            >
              Try live demo
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See How Contractors Win Projects With Renderspace. Try The Live Demo
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience the real Studio — generate up to 5 renders with no subscription required.
            </p>
            <Link
              href="/studio/exterior?demo=true"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
            >
              Try the Live Demo
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
        <ExampleProject />
        <HowItWorks />
        <StudioPreview />
        <ConversionCTA />
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-white transition-colors">
            Renderspace
          </Link>
          {" · "}
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          {" · "}
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </div>
      </footer>
    </div>
  )
}
