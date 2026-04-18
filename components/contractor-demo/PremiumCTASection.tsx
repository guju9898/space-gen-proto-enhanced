import Link from "next/link"

interface PremiumCTASectionProps {
  cityLabel: string | null
  onClickPremium: () => void
}

export function PremiumCTASection({ cityLabel, onClickPremium }: PremiumCTASectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-4xl mx-auto rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-violet-700/10 p-8">
        <p className="text-orange-300 text-xs uppercase tracking-wide font-semibold mb-2">Urgency</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          If You Don&apos;t Use This, Your Competitors Will.
        </h2>
        <p className="text-muted-foreground mb-6">
          {cityLabel ? `Contractors in ${cityLabel} ` : "Contractors "}
          who show the vision win trust faster. We only work with a few contractors per area to keep delivery quality
          high and avoid direct overlap.
        </p>
        <Link
          href="/book-demo"
          onClick={onClickPremium}
          className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
        >
          Claim Premium Area Access
        </Link>
      </div>
    </section>
  )
}
