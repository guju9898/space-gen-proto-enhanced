import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Start showing clients the finished result.
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join contractors who close more deals by showing, not just telling.
        </p>
        <Link
          href="/contractor-demo"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
        >
          Try the contractor demo
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
