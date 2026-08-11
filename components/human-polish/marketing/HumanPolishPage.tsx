"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { trackHumanPolishEvent } from "../analytics"
import { HumanPolishCheckoutCancelledAnalytics } from "../analytics/HumanPolishCheckoutCancelledAnalytics"
import { HeroSection } from "./HeroSection"
import { ServiceFamilyForkSection } from "./ServiceFamilyForkSection"
import { AiRenderPacksSection } from "./AiRenderPacksSection"
import { FirstPurchasePromoSection } from "./FirstPurchasePromoSection"
import { IntakeHowItWorksSection } from "./IntakeHowItWorksSection"
import { RenderPackPricingSection } from "./RenderPackPricingSection"
import { ChatGptObjectionSection } from "./ChatGptObjectionSection"
import { ProofSection } from "./ProofSection"
import { BuildReadyExplanationSection } from "./BuildReadyExplanationSection"
import { BuildReadyPricingSection } from "./BuildReadyPricingSection"
import { HoaSupportSection } from "./HoaSupportSection"
import { ScopeExpectationsSection } from "./ScopeExpectationsSection"
import { TurnaroundCapacitySection } from "./TurnaroundCapacitySection"
import { GuaranteeSection } from "./GuaranteeSection"
import { FinalCtaSection } from "./FinalCtaSection"
import { AssistedSalesSection } from "./AssistedSalesSection"

export function HumanPolishPage() {
  const promoTracked = useRef(false)

  useEffect(() => {
    trackHumanPolishEvent("viewed_human_polish")
  }, [])

  useEffect(() => {
    const target = document.getElementById("first-purchase-promo")
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting || promoTracked.current) return
        promoTracked.current = true
        trackHumanPolishEvent("first_purchase_promo_viewed", { package: "25" })
        observer.disconnect()
      },
      { threshold: 0.4 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const handleSelectFamily = (family: "ai-render-pack" | "build-ready") => {
    trackHumanPolishEvent("selected_service_family", { family })
  }

  const handleSelectPack = (packageId: "25" | "50" | "100") => {
    trackHumanPolishEvent("selected_render_pack", { package: packageId, family: "ai-render-pack" })
  }

  const handleSelectBuildReady = (packageId: "essentials-2d" | "essentials-3d" | "custom") => {
    if (packageId === "custom") {
      trackHumanPolishEvent("clicked_custom_quote", { family: "build-ready", package: packageId })
    } else {
      trackHumanPolishEvent("clicked_build_ready", { family: "build-ready", package: packageId })
    }
  }

  const handleRequestCall = () => {
    trackHumanPolishEvent("requested_call", { source: "assisted_sales" })
  }

  const handleClickWhatsapp = () => {
    trackHumanPolishEvent("clicked_whatsapp", { source: "assisted_sales" })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HumanPolishCheckoutCancelledAnalytics />
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
            <a
              href="#render-pack-pricing"
              className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-2 rounded-md"
            >
              View Packs
            </a>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection onSelectFamily={handleSelectFamily} />
        <ServiceFamilyForkSection onSelectFamily={handleSelectFamily} />
        <AiRenderPacksSection />
        <FirstPurchasePromoSection onSelectPack={handleSelectPack} />
        <IntakeHowItWorksSection />
        <RenderPackPricingSection onSelectPack={handleSelectPack} />
        <ChatGptObjectionSection />
        <ProofSection />
        <BuildReadyExplanationSection />
        <BuildReadyPricingSection onSelectBuildReady={handleSelectBuildReady} />
        <HoaSupportSection />
        <ScopeExpectationsSection />
        <TurnaroundCapacitySection />
        <GuaranteeSection />
        <FinalCtaSection onSelectPack={handleSelectPack} onSelectBuildReady={handleSelectBuildReady} />
        <AssistedSalesSection onRequestCall={handleRequestCall} onClickWhatsapp={handleClickWhatsapp} />
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
          {" · "}
          <Link href="/blog" className="hover:text-white transition-colors">
            Blog
          </Link>
        </div>
      </footer>
    </div>
  )
}
