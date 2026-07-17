import Link from "next/link"
import { FIRST_PURCHASE_25_PRICE, formatUsd } from "./marketingConfig"

interface FirstPurchasePromoSectionProps {
  onSelectPack: (packageId: "25") => void
}

export function FirstPurchasePromoSection({ onSelectPack }: FirstPurchasePromoSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14" id="first-purchase-promo">
      <div className="max-w-6xl mx-auto rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500/15 via-violet-700/20 to-[#191f33]/80 p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-orange-200 text-xs uppercase tracking-wide font-bold mb-2">First-purchase promotion</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              First 25-pack: {formatUsd(FIRST_PURCHASE_25_PRICE)}
            </h2>
            <p className="text-muted-foreground mb-3">
              New customers can start with the 25-concept pack at{" "}
              <span className="text-white font-semibold">{formatUsd(FIRST_PURCHASE_25_PRICE)}</span> instead of the
              standard {formatUsd(399)}. This promotion applies only to the first 25-render purchase.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Eligibility is verified server-side (normalized phone history).</li>
              <li>• Discounts do not stack — checkout applies the single best eligible offer.</li>
              <li>• Active subscribers may receive 15% off instead when that price is lower ({formatUsd(339.15)}).</li>
              <li>• This is a first-purchase offer, not a permanent list price.</li>
            </ul>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/human-polish/intake?family=ai-render-pack&package=25"
              onClick={() => onSelectPack("25")}
              className="inline-flex w-full md:w-auto items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
            >
              Start first 25-pack
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
