"use client"

import { useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { HeroProofSection } from "./HeroProofSection"
import { PainSection } from "./PainSection"
import { ReframeSection } from "./ReframeSection"
import { ProofStackSection } from "./ProofStackSection"
import { SocialProofSubstituteSection } from "./SocialProofSubstituteSection"
import { DemoCTASection } from "./DemoCTASection"
import { ContractorDemoVideoSection } from "./ContractorDemoVideoSection"
import { PremiumCTASection } from "./PremiumCTASection"
import { MailerPreviewSection } from "./MailerPreviewSection"
import { ContractorDemoRoiSection } from "./ContractorDemoRoiSection"
import { OfferSection } from "./OfferSection"
import { PlanSelectionSection } from "./PlanSelectionSection"
import { FinalCTASection } from "./FinalCTASection"
import { trackContractorDemoEvent } from "./analytics"
import { CITY_LABELS } from "@/lib/contractor-demo/cities"
import { premiumBookingHref } from "@/lib/premium/booking"
import { PremiumOnboardingAvailability } from "@/components/conversion/group-5/PremiumOnboardingAvailability"


interface ContractorDemoPageProps {
  citySlug?: string
}

export function ContractorDemoPage({ citySlug }: ContractorDemoPageProps) {
  const cityLabel = useMemo(() => {
    if (!citySlug) return null
    return CITY_LABELS[citySlug.toLowerCase()] ?? null
  }, [citySlug])

  useEffect(() => {
    trackContractorDemoEvent("viewed_contractor_demo", {
      city: cityLabel ?? "generic",
      slug: citySlug ?? "none",
    })
  }, [cityLabel, citySlug])

  useEffect(() => {
    if (citySlug) {
      trackContractorDemoEvent("loaded_city_slug", {
        city: cityLabel ?? "generic",
        slug: citySlug,
        recognized: Boolean(cityLabel),
      })
    }
  }, [cityLabel, citySlug])

  const handlePremiumClick = () => trackContractorDemoEvent("clicked_premium_cta", { city: cityLabel ?? "generic" })
  const handleBusinessClick = () =>
    trackContractorDemoEvent("clicked_business_cta", { city: cityLabel ?? "generic" })
  const handleProfessionalClick = () =>
    trackContractorDemoEvent("clicked_professional_cta", { city: cityLabel ?? "generic" })
  const handleDemoClick = () => trackContractorDemoEvent("clicked_try_demo", { city: cityLabel ?? "generic" })
  const handleMailerViewed = () => trackContractorDemoEvent("viewed_mailer_section", { city: cityLabel ?? "generic" })
  const premiumHref = premiumBookingHref({ citySlug })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/amethyst-flow.png" alt="Renderspace" width={32} height={32} className="w-8 h-8" />
            <span className="font-bold text-lg text-white">Renderspace</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/human-polish" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Human Polish™
            </Link>
            <Link
              href={premiumHref}
              onClick={handlePremiumClick}
              className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-2 rounded-md"
            >
              Premium Setup
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <HeroProofSection cityLabel={cityLabel} premiumHref={premiumHref} onClickPremium={handlePremiumClick} onClickDemo={handleDemoClick} />
        <PainSection cityLabel={cityLabel} />
        <ReframeSection />
        <ContractorDemoVideoSection />
        <ProofStackSection />
        <SocialProofSubstituteSection />
        <DemoCTASection onClickDemo={handleDemoClick} />
        <PremiumCTASection cityLabel={cityLabel} premiumHref={premiumHref} onClickPremium={handlePremiumClick} />
        <PremiumOnboardingAvailability service="premium_onboarding" href={premiumHref} />
        <ContractorDemoRoiSection />
        <MailerPreviewSection onViewed={handleMailerViewed} />
        <PremiumOnboardingAvailability
          service="mailer"
          href={premiumBookingHref({ citySlug, source: "mailer" })}
        />
        <OfferSection premiumHref={premiumHref} onClickPremium={handlePremiumClick} />
        <PlanSelectionSection onClickBusiness={handleBusinessClick} onClickProfessional={handleProfessionalClick} />
        <FinalCTASection
          cityLabel={cityLabel}
          premiumHref={premiumHref}
          onClickPremium={handlePremiumClick}
          onClickBusiness={handleBusinessClick}
          onClickProfessional={handleProfessionalClick}
          onClickDemo={handleDemoClick}
        />
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-white transition-colors">
            Renderspace
          </Link>
          {" · "}
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          {" · "}
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </div>
      </footer>
    </div>
  )
}

