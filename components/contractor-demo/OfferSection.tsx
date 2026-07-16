import Link from "next/link"

interface OfferSectionProps {
  onClickPremium: () => void
}

export function OfferSection({ onClickPremium }: OfferSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-6xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-primary text-xs uppercase tracking-wide font-semibold mb-2">Primary Offer</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Don&apos;t Just Get The Tool. Get The Whole System Installed In Your Business.
            </h2>
            <div className="text-muted-foreground space-y-4">
              <p>The Premium Done-For-You Revenue System is not software you figure out on your own.</p>
              <p>
                It&apos;s a complete visual selling infrastructure — built, branded, and installed into your sales process
                by us.
              </p>
              <p>For a contractor doing $1M+ per year, this is not a cost.</p>
              <p>It&apos;s the cheapest salesperson you&apos;ve ever hired.</p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-6">
            <p className="text-white text-2xl font-bold">$3,000 Setup</p>
            <p className="text-white text-2xl font-bold mt-1">+ $600/month</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>• Business-level Renderspace usage included</li>
              <li>• Branded outbound / homeowner mailer support</li>
              <li>
                • Human Polish — First Job Render Package
                <p className="mt-1.5 pl-0 text-xs text-muted-foreground leading-relaxed font-normal">
                  Our team personally generates and refines 25 photorealistic concepts for your first client project. You
                  walk into that estimate with visuals that look like a design firm spent a week on them.
                </p>
                <p className="mt-2 text-xs text-muted-foreground/90 leading-relaxed font-normal">
                  AI generates it. Our team perfects it. You close with it.
                </p>
              </li>
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
