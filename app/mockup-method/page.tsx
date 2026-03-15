import Image from "next/image"
import Link from "next/link"
import { HeroSection } from "@/components/mockup/HeroSection"
import { BeforeAfterShowcase } from "@/components/mockup/BeforeAfterShowcase"
import { ProblemSection } from "@/components/mockup/ProblemSection"
import { MockupMethodSteps } from "@/components/mockup/MockupMethodSteps"
import { CaseStudySection } from "@/components/mockup/CaseStudySection"
import { UseCasesSection } from "@/components/mockup/UseCasesSection"
import { FinalCTA } from "@/components/mockup/FinalCTA"

export default function MockupMethodPage() {
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
              href="/contractor-demo"
              className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-4 py-2 rounded-md"
            >
              Contractor demo
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection />
        <BeforeAfterShowcase />
        <ProblemSection />
        <MockupMethodSteps />
        <CaseStudySection />
        <UseCasesSection />
        <FinalCTA />
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
