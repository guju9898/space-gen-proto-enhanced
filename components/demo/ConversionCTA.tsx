import Link from "next/link"

export function ConversionCTA() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Start winning more projects.
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join contractors who close deals by showing the result first.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto"
          >
            Start Intro Plan
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  )
}
