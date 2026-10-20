import Link from "next/link"

interface PremiumCTASectionProps {
  cityLabel: string | null
  premiumHref: string
  onClickPremium: () => void
}

export function PremiumCTASection({ cityLabel, premiumHref, onClickPremium }: PremiumCTASectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-6xl mx-auto rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-violet-700/10 p-8">
        <p className="text-orange-300 text-xs uppercase tracking-wide font-semibold mb-2">Done for you</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {cityLabel ? `A visual sales system for ${cityLabel} contractors.` : "A visual sales system for your estimates."}
        </h2>
        <div className="text-muted-foreground mb-6 space-y-4">
          <p>
            Show the homeowner a photorealistic concept of their own yard during the estimate. Premium onboarding sets
            up that workflow, the homeowner mailers, and the first Human Polish package with your team.
          </p>
          <p>Self-serve Renderspace plans stay available in every city. This section is the done-for-you setup.</p>
        </div>
        <Link
          href={premiumHref}
          onClick={onClickPremium}
          className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
        >
          Build My Visual Sales System
        </Link>
      </div>
    </section>
  )
}
