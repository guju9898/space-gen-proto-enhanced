import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
        Win Projects Before Construction Starts
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        Show your client the finished design in seconds — before the first shovel hits the ground.
      </p>
      <Link
        href="/contractor-demo"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
      >
        Try the contractor demo
        <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  )
}
