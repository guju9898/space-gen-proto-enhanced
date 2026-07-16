import Link from "next/link"

interface PremiumCTASectionProps {
  cityLabel: string | null
  onClickPremium: () => void
}

export function PremiumCTASection({ cityLabel, onClickPremium }: PremiumCTASectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-6xl mx-auto rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-violet-700/10 p-8">
        <p className="text-orange-300 text-xs uppercase tracking-wide font-semibold mb-2">Urgency</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {cityLabel ? (
            <>Your Competitors In {cityLabel} Are About To Have This.</>
          ) : (
            <>If You Don&apos;t Use This, Your Competitors Will.</>
          )}
        </h2>
        <div className="text-muted-foreground mb-6 space-y-4">
          <p>
            Right now, a small number of landscaping and outdoor living contractors in every market are adopting visual
            selling.
          </p>
          {cityLabel ? (
            <p>We currently have a limited number of spots available in the {cityLabel} market.</p>
          ) : null}
          <p>They&apos;re showing up to estimates with photorealistic renders of the client&apos;s actual yard.</p>
          <p>They&apos;re not better contractors. They&apos;re not cheaper. They&apos;re just easier to say yes to.</p>
          <p>The contractor who owns visual selling in your market will own the market.</p>
          <p>
            We limit Renderspace to a small number of contractors per city — not as a sales tactic, but because flooding
            one market with the same tool destroys the advantage for everyone.
          </p>
          <p>Once your area is claimed, it&apos;s claimed.</p>
          <p>If you&apos;re reading this, it&apos;s not claimed yet.</p>
        </div>
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
