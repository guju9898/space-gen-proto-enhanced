import Link from "next/link"

interface FinalCTASectionProps {
  cityLabel: string | null
  onClickPremium: () => void
  onClickBusiness: () => void
  onClickProfessional: () => void
  onClickDemo: () => void
}

export function FinalCTASection({
  cityLabel,
  onClickPremium,
  onClickBusiness,
  onClickProfessional,
  onClickDemo,
}: FinalCTASectionProps) {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto rounded-xl border border-[#343434] bg-gradient-to-r from-[#9747ff]/20 to-[#8608fd]/20 p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {cityLabel ? `${cityLabel} Contractors: ` : ""}Choose Your Fastest Path To More Closed Jobs
        </h2>
        <p className="text-muted-foreground mb-8">
          You can keep losing deals to indecision, or you can make the outcome obvious and become the easy yes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/book-demo"
            onClick={onClickPremium}
            className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Premium Done-For-You
          </Link>
          <Link
            href="/onboarding?step=3&plan=business"
            onClick={onClickBusiness}
            className="inline-flex items-center justify-center bg-[#191f33] hover:bg-[#232a45] transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Start Business
          </Link>
          <Link
            href="/onboarding?step=3&plan=professional"
            onClick={onClickProfessional}
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Start Professional
          </Link>
          <Link
            href="/studio/exterior?demo=true"
            onClick={onClickDemo}
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Try Demo First
          </Link>
        </div>
      </div>
    </section>
  )
}

