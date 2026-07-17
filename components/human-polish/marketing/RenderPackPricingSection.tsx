import Link from "next/link"
import {
  AI_RENDER_PACKS,
  FIRST_PURCHASE_25_PRICE,
  SUBSCRIBER_DISCOUNT_PERCENT,
  PACK_EXPIRATION_DAYS,
  formatUsd,
} from "./marketingConfig"

interface RenderPackPricingSectionProps {
  onSelectPack: (packageId: "25" | "50" | "100") => void
}

export function RenderPackPricingSection({ onSelectPack }: RenderPackPricingSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14" id="render-pack-pricing">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Render Pack pricing</h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Standard prices before tax. Tax is calculated separately by Stripe Tax. Exactly one pack per checkout in V1.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {AI_RENDER_PACKS.map((pack) => (
            <article
              key={pack.packageId}
              className={`relative rounded-xl border bg-[#191f33]/50 p-8 ${
                pack.packageId === "50" ? "border-orange-500/40" : "border-[#343434]"
              }`}
            >
              {pack.packageId === "50" ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-orange-500/40 bg-gradient-to-r from-orange-500/25 to-violet-700/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-200">
                  Popular
                </span>
              ) : null}
              <h3 className="text-xl font-bold text-white">{pack.label}</h3>
              <p className="text-3xl font-bold text-white mt-3">{formatUsd(pack.standardPrice)}</p>
              {pack.packageId === "25" ? (
                <p className="text-sm text-orange-200 mt-1">
                  First purchase: {formatUsd(FIRST_PURCHASE_25_PRICE)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Standard package price</p>
              )}
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li>• First batch: {pack.firstBatch} concepts</li>
                <li>• Delivery target: {pack.delivery}</li>
                <li>
                  • Subscriber price: {formatUsd(pack.subscriberPrice)} ({SUBSCRIBER_DISCOUNT_PERCENT}% off)
                </li>
              </ul>
              <Link
                href={pack.href}
                onClick={() => onSelectPack(pack.packageId)}
                className={`mt-6 inline-flex w-full items-center justify-center transition-all text-white px-5 py-3 rounded-md font-medium ${
                  pack.packageId === "50"
                    ? "bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90"
                    : "border border-white/30 hover:bg-white/10"
                }`}
              >
                Start {pack.label}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[#343434] bg-[#191f33]/50 p-8 text-sm text-muted-foreground space-y-3">
          <p>
            <span className="text-white font-medium">Subscriber discount:</span> Active Renderspace Professional and
            Business subscribers receive {SUBSCRIBER_DISCOUNT_PERCENT}% off AI Render Packs. Guests can check out without
            an account, but must sign in with an active authenticated subscription to claim the discount.
          </p>
          <p>
            <span className="text-white font-medium">Discounts do not stack.</span> Checkout applies the single best
            eligible offer (for example, a 25-pack buyer eligible for both first-purchase and subscriber pricing receives
            the lower subscriber price of {formatUsd(339.15)}, not both reductions).
          </p>
          <p>
            <span className="text-white font-medium">{PACK_EXPIRATION_DAYS}-day pack period:</span> AI Render Packs must
            be used within {PACK_EXPIRATION_DAYS} days of purchase. Expiration and start date are shown before checkout.
          </p>
          <p>
            Need multiple packs, ongoing production, or volume arrangements? Request a short team call or WhatsApp
            conversation — quantity cannot be increased in Stripe Checkout.
          </p>
        </div>
      </div>
    </section>
  )
}
