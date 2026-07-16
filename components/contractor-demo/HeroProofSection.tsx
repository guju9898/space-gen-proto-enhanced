import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { RenderspaceBeforeAfterSlider } from "@/components/RenderspaceBeforeAfterSlider"
import { getContractorDemoSliderCategories } from "./contractorDemoSliderData"

interface HeroProofSectionProps {
  cityLabel: string | null
  onClickPremium: () => void
  onClickDemo: () => void
}

function CopyBlock({
  title,
  body,
  align,
}: {
  title: string
  body: string
  align: "before" | "after"
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#0c0f18]/90 px-4 py-4 md:px-5 md:py-5 shrink-0 w-full lg:w-[200px] xl:w-[220px] ${
        align === "before" ? "lg:text-left" : "lg:text-right"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      <p className="text-sm text-white/90">{body}</p>
    </div>
  )
}

export function HeroProofSection({ cityLabel, onClickPremium, onClickDemo }: HeroProofSectionProps) {
  const { categories, categoryOrder } = getContractorDemoSliderCategories()

  const beforeBody = "This is the yard that lost you the job."
  const afterBody = "This is the yard that closed it."

  return (
    <section className="container mx-auto px-4 py-10 md:py-16">
      <div className="text-center max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          You&apos;re Not Losing Jobs Because You&apos;re Bad.
          <span className="block mt-2">You&apos;re Losing Them Because They Can&apos;t See It.</span>
        </h1>
        <p className="text-muted-foreground text-lg mt-5 max-w-4xl mx-auto">
          Renderspace turns a blank yard into a photorealistic vision in 30 seconds — shown on-site, during the estimate,
          before you leave the driveway. The contractor who shows the vision first wins the job.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/book-demo"
            onClick={onClickPremium}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto justify-center"
          >
            Install My Revenue System
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/studio/exterior?demo=true"
            onClick={onClickDemo}
            className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 transition-all text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto justify-center"
          >
            Try It Free On A Real Yard &rarr;
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          No account required. No credit card.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          This Is What Every Contractor Shows. And This Is What Closes On The Spot.
        </h2>
      </div>

      {/* Mobile: before → slider → after | Desktop: three-column side-by-side */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-6 max-w-6xl mx-auto w-full">
        <div className="order-1 lg:order-1">
          <CopyBlock title="Before" body={beforeBody} align="before" />
        </div>
        <div className="order-2 lg:order-2 min-w-0 flex-1 flex justify-center">
          <RenderspaceBeforeAfterSlider categories={categories} categoryOrder={categoryOrder} />
        </div>
        <div className="order-3 lg:order-3">
          <CopyBlock title="After" body={afterBody} align="after" />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground max-w-4xl mx-auto">
        These renders were generated in under 30 seconds. From a photo taken on a phone. At an estimate.
      </p>
    </section>
  )
}

