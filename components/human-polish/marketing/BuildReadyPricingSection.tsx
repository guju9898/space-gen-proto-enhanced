import Link from "next/link"
import { ESSENTIALS_2D_PRICE, ESSENTIALS_3D_PRICE, formatUsd } from "./marketingConfig"

interface BuildReadyPricingSectionProps {
  onSelectBuildReady: (packageId: "essentials-2d" | "essentials-3d" | "custom") => void
}

export function BuildReadyPricingSection({ onSelectBuildReady }: BuildReadyPricingSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14" id="build-ready-pricing">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Build-Ready pricing</h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Prices before tax. Delivery targets begin after complete-file acceptance and payment.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <h3 className="text-xl font-bold text-white">Essentials 2D</h3>
            <p className="text-3xl font-bold text-white mt-3">{formatUsd(ESSENTIALS_2D_PRICE)}</p>
            <p className="text-sm text-muted-foreground mt-1">Delivery target: 3–5 business days</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>• Site map</li>
              <li>• Hardscape plan</li>
              <li>• Conceptual material list or material legend</li>
              <li>• Property survey integration</li>
              <li>• Selected rendering(s) in the presentation package</li>
              <li>• Two combined revision rounds</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Minimum intake: property survey, clear site photo(s), and an inspiration image or approved concept.
            </p>
            <Link
              href="/human-polish/intake?family=build-ready&package=essentials-2d"
              onClick={() => onSelectBuildReady("essentials-2d")}
              className="mt-6 inline-flex w-full items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Start Essentials 2D
            </Link>
          </article>

          <article className="relative rounded-xl border border-orange-500/40 bg-[#191f33]/50 p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-orange-500/40 bg-gradient-to-r from-orange-500/25 to-violet-700/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-200">
              Includes 3D views
            </span>
            <h3 className="text-xl font-bold text-white">Essentials 3D</h3>
            <p className="text-3xl font-bold text-white mt-3">{formatUsd(ESSENTIALS_3D_PRICE)}</p>
            <p className="text-sm text-muted-foreground mt-1">Delivery target: 5–10 business days</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>• Everything in Essentials 2D</li>
              <li>• Three guaranteed human-produced photorealistic views</li>
              <li>• Up to two additional supporting/detail views when scope allows</li>
              <li>• Geometry, material, lighting, and planting refinement</li>
              <li>• Three combined revision rounds across 2D and 3D</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Additional supporting views are discretionary and not guaranteed when complexity or available information
              does not support them.
            </p>
            <Link
              href="/human-polish/intake?family=build-ready&package=essentials-3d"
              onClick={() => onSelectBuildReady("essentials-3d")}
              className="mt-6 inline-flex w-full items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Start Essentials 3D
            </Link>
          </article>

          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <h3 className="text-xl font-bold text-white">Custom</h3>
            <p className="text-3xl font-bold text-white mt-3">Quoted</p>
            <p className="text-sm text-muted-foreground mt-1">After human scope review</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>• Commercial, estates, multi-phase, or multi-structure work</li>
              <li>• Complex grading or unusually large hardscape scopes</li>
              <li>• Multiple properties or unusual deliverable requirements</li>
              <li>• Requests that resemble permit or construction-document work are routed to custom review</li>
            </ul>
            <Link
              href="/human-polish/intake?family=build-ready&package=custom"
              onClick={() => onSelectBuildReady("custom")}
              className="mt-6 inline-flex w-full items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Request custom quote
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
