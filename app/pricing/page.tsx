import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { PLANS, count, usd } from "@/lib/seo/facts"
import { softwareApplicationLd } from "@/lib/seo/schema"
import Link from "next/link"
import { SelfServePrices } from "@/components/conversion/group-3/SelfServePrices"
import { SiteHeader } from "@/components/site/SiteHeader"
import { ChevronRight } from "lucide-react"
import { SiteFooter } from "@/components/site/SiteFooter"

export const metadata: Metadata = pageMetadata({
  path: "/pricing",
  title: `Pricing: ${usd(PLANS.starter.priceUsd)}/week, Plans From ${usd(PLANS.professional.priceUsd)}/mo`,
  description: `First Job Test is a weekly subscription: ${usd(PLANS.starter.priceUsd)} today for ${PLANS.starter.credits} credits, then the same amount each week until you cancel. Professional is ${usd(PLANS.professional.priceUsd)}/mo for ${count(PLANS.professional.credits)} credits; Business is ${usd(PLANS.business.priceUsd)}/mo for ${count(PLANS.business.credits)} credits.`,
})

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={softwareApplicationLd()} />
      <SiteHeader active="pricing" />

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Simple, transparent pricing</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Choose the plan that fits your workflow. From solo designers to teams — scale as you grow.
        </p>
      </section>

      {/* Pricing cards (reuse landing structure) */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          Find the perfect plan for your design needs, from one-time projects to professional use
        </p>

        <SelfServePrices />

        {/* Value Anchor Block */}
        <div className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33] p-6 mb-10 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-white">
            One render can help close a <span className="font-semibold text-white">$20,000</span> project
          </h3>
          <p className="text-muted-foreground mt-2">
            Renderspace costs less than <span className="font-semibold text-white">0.5%</span> of a single job.
          </p>
        </div>

      </section>

      {/* Business trust reinforcement */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-[#191f33]/50 rounded-xl p-8 border border-[#343434]">
          <h2 className="text-2xl font-bold mb-4 text-white text-center">Trusted by professionals</h2>
          <p className="text-muted-foreground text-center mb-6">
            Contractors, designers, and landscapers use Renderspace to align with clients faster and win more projects.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• No long-term commitment — cancel anytime</li>
            <li>• Secure payment via Stripe</li>
            <li>• Client-ready 4K exports</li>
          </ul>
          <p className="text-center mt-6">
            <Link href="/faq" className="text-primary hover:underline inline-flex items-center gap-1">
              Questions? See our FAQ <ChevronRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter className="mt-16" />
    </div>
  )
}
