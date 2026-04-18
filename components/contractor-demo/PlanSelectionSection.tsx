import Link from "next/link"

interface PlanSelectionSectionProps {
  onClickBusiness: () => void
  onClickProfessional: () => void
}

export function PlanSelectionSection({ onClickBusiness, onClickProfessional }: PlanSelectionSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">Prefer To Run It Yourself?</h2>
        <p className="text-muted-foreground text-center mb-8">
          Start self-serve and keep full control. Upgrade to done-for-you when you want speed and leverage.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <article className="relative rounded-xl border border-[#343434] bg-[#191f33]/50 p-6 pt-8">
            <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-orange-500/40 bg-gradient-to-r from-orange-500/25 to-violet-700/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-200 shadow-[0_0_20px_-4px_rgba(249,115,22,0.5)]">
              Most Popular
            </span>
            <h3 className="text-xl font-bold text-white">Professional</h3>
            <p className="text-3xl font-bold text-white mt-2">
              $98<span className="text-sm text-muted-foreground"> / month</span>
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              For owner-operators who want to visualize jobs fast and close more projects without adding design overhead.
            </p>
            <Link
              href="/onboarding?step=3&plan=professional"
              onClick={onClickProfessional}
              className="mt-6 inline-flex w-full items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Start Professional
            </Link>
          </article>

          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-6">
            <h3 className="text-xl font-bold text-white">Business</h3>
            <p className="text-3xl font-bold text-white mt-2">
              $349<span className="text-sm text-muted-foreground"> / month</span>
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              For active teams handling high volume across landscaping, patios, pergolas, and outdoor living projects.
            </p>
            <Link
              href="/onboarding?step=3&plan=business"
              onClick={onClickBusiness}
              className="mt-6 inline-flex w-full items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Start Business
            </Link>
          </article>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link
            href="https://renderspace.ai/studio/exterior?demo=true"
            className="underline-offset-4 hover:text-white hover:underline"
          >
            Not sure yet? Try the free demo — no account required.
          </Link>
        </p>
      </div>
    </section>
  )
}
