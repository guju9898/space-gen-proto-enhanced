import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface DemoCTASectionProps {
  onClickDemo: () => void
}

export function DemoCTASection({ onClickDemo }: DemoCTASectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-6xl mx-auto rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-violet-700/10 p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">
          These Renders Were Made Inside Renderspace.
        </h2>
        <div className="text-muted-foreground text-center space-y-3 mb-8 max-w-4xl mx-auto">
          <p>You can generate one yourself in the next 4 minutes.</p>
          <p>No account. No credit card. No designer.</p>
        </div>
        <div className="flex flex-col items-center">
          <Link
            href="https://renderspace.ai/studio/exterior?demo=true"
            onClick={onClickDemo}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto"
          >
            Try It Free On A Real Yard &rarr;
            <ChevronRight className="w-4 h-4" />
          </Link>
          <p className="mt-2 text-xs text-muted-foreground text-center max-w-md">
            Works best on tablet or laptop. Upload a photo or start from scratch.
          </p>
        </div>
      </div>
    </section>
  )
}
