import Link from "next/link"

interface OfferSectionProps {
  onClickPremium: () => void
}

export function OfferSection({ onClickPremium }: OfferSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-5xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-primary text-xs uppercase tracking-wide font-semibold mb-2">Primary Offer</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Premium Done-For-You Revenue System
            </h2>
            <p className="text-muted-foreground">
              We install this into your business so your team can close outdoor living projects with visual confidence.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-6">
            <p className="text-white text-2xl font-bold">$3,000 Setup</p>
            <p className="text-white text-2xl font-bold mt-1">+ $600/month</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Business-level Renderspace usage included</li>
              <li>• Branded outbound / homeowner mailer support</li>
              <li>• Human polish support for HOA-facing visuals</li>
              <li>• Funnel-focused implementation and messaging guidance</li>
            </ul>
            <Link
              href="/book-demo"
              onClick={onClickPremium}
              className="mt-6 inline-flex w-full items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Apply For Premium Setup
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

