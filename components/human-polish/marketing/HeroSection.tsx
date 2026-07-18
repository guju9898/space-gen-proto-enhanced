import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface HeroSectionProps {
  onSelectFamily: (family: "ai-render-pack" | "build-ready") => void
}

export function HeroSection({ onSelectFamily }: HeroSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14 md:py-16">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-primary text-xs uppercase tracking-wide font-semibold mb-3">Human Polish™</p>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Your Outsourced Visualization Department
        </h1>
        <p className="text-muted-foreground text-lg mt-5 max-w-3xl mx-auto">
          Use Renderspace to explore quickly. Use Human Polish when the project needs a real team behind it —
          done-for-you concept packs or Build-Ready presentation packages.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <a
            href="#ai-render-packs"
            onClick={() => onSelectFamily("ai-render-pack")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto justify-center"
          >
            Explore AI Render Packs
            <ChevronRight className="w-4 h-4" />
          </a>
          <a
            href="#build-ready"
            onClick={() => onSelectFamily("build-ready")}
            className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 transition-all text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto justify-center"
          >
            See Build-Ready Packages
          </a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Prefer self-serve exploration?{" "}
          <Link href="/studio/exterior?demo=true" className="text-white underline-offset-4 hover:underline">
            Try Renderspace free
          </Link>
        </p>
      </div>
    </section>
  )
}
