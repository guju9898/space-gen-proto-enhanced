"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { RenderspaceBeforeAfterSlider } from "@/components/RenderspaceBeforeAfterSlider"
import { IntroPlanLink } from "@/components/marketing/IntroPlanLink"
import { HomeCtaLink } from "@/components/conversion/group-1/HomeExperimentAnalytics"
import { GUEST_STUDIO_HREF, type HomeVariant } from "@/components/conversion/group-1/experiment"
import { CATALOG, MOST_POPULAR_PLAN, moneyFromCents, perRenderLabel } from "@/lib/pricing/catalog"
import { PROOF } from "@/lib/seo/facts"
import { GALLERY_PRESETS, studioPresetHref } from "@/lib/gallery/presets"

const primaryClass =
  "inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
const secondaryClass =
  "inline-flex items-center border border-white/30 hover:bg-white/10 transition-all text-white px-6 py-3 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/** Wave 5 hero CTAs — both A/B variants keep recording the headline variant. */
export function HomeWave5HeroActions({ variant }: { variant: HomeVariant }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <HomeCtaLink href={GUEST_STUDIO_HREF} variant={variant} destination="guest_studio" className={primaryClass}>
          Try it on your photo: 5 free renders <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </HomeCtaLink>
        <HomeCtaLink href="/gallery" variant={variant} destination="gallery" className={secondaryClass}>
          See real projects
        </HomeCtaLink>
      </div>
      <IntroPlanLink
        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        onClick={() => {
          // Paid plan as a text link; homepage analytics still fire via HomeCtaLink destinations above.
        }}
      >
        Or start the {CATALOG.intro.name} for {moneyFromCents(CATALOG.intro.amountCents)}/week
      </IntroPlanLink>
    </div>
  )
}

export function HomeProofStrip() {
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
      <li>
        <span className="font-semibold text-white">{PROOF.rendersGenerated}+</span> renders generated
      </li>
      <li>
        <span className="font-semibold text-white">~{PROOF.secondsPerConcept.typical} sec</span> from photo to concept
      </li>
      <li>
        <span className="font-semibold text-white">{PROOF.secondsPerConcept.min}–{PROOF.secondsPerConcept.max}s</span> typical
      </li>
    </ul>
  )
}

export function HomeHeroWithSlider({ variant }: { variant: HomeVariant }) {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16 text-center">
      <p className="text-sm font-medium text-primary mb-4">
        For pool builders, landscape and outdoor-living contractors, remodelers and designers
      </p>
      {variant === "b" ? (
        <>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white text-balance">
            Show the Finished Job. Before You Quote It.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Turn a real job-site photo into a photorealistic concept, customize the design details, and use the result
            to explain the project you are proposing.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white text-balance">
            Show Clients the Finished Project Before You Quote
            <span className="block mt-2 text-2xl md:text-3xl font-semibold text-white/90">
              AI renderings from a job-site photo in about {PROOF.secondsPerConcept.typical} seconds
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Renderspace turns a photo of your client&apos;s yard, home or room into a photorealistic concept. Show it on
            the spot and lock in the direction before anyone prices the job.
          </p>
        </>
      )}
      <HomeWave5HeroActions variant={variant} />
      <HomeProofStrip />
      <div className="mt-10 max-w-5xl mx-auto">
        <RenderspaceBeforeAfterSlider className="max-w-5xl" />
        <p className="text-xs text-muted-foreground mt-3">Drag the slider. Each pair was generated from a single photo.</p>
      </div>
    </section>
  )
}

const FALLBACK_COVERS = [
  "/landing/renders/landscape-hero-01.jpg",
  "/landing/renders/exterior-hero-01.jpg",
  "/landing/renders/interior-hero-01.jpg",
  "/landing/renders/cta-render-01.jpg",
]

const RECREATE = GALLERY_PRESETS.slice(0, 6)

export function HomeRecreateCards() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white text-center">Recreate a look like this</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-center">
        Open a preset in the demo Studio, or start a design in the same direction.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {RECREATE.map((preset, i) => {
          const href = studioPresetHref(preset, { demo: true })
          const isPreset = Boolean(preset.referenceImage) || i % 2 === 0
          const cover = preset.referenceImage?.src ?? FALLBACK_COVERS[i % FALLBACK_COVERS.length]
          return (
            <Link
              key={preset.slug}
              href={isPreset ? href : GUEST_STUDIO_HREF}
              className="group rounded-lg border border-border overflow-hidden bg-card hover:border-primary/40 transition-colors"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={cover}
                  alt={preset.referenceImage?.alt ?? ""}
                  fill
                  className="object-cover"
                  sizes="(min-width:1024px) 33vw, 50vw"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{preset.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPreset ? "Open this preset in demo" : "Start a design like this"}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function HomePhotoToProposal() {
  return (
    <section className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">From photo to proposal in one visit</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Photograph the site, render a concept, compare it with the photo, and send a client link before you leave the
        driveway.
      </p>
    </section>
  )
}

export function HomePlanCards() {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {(["professional", "business"] as const).map((code) => {
        const plan = CATALOG[code]
        const popular = code === MOST_POPULAR_PLAN
        return (
          <div key={code} className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434] relative">
            {popular && (
              <span className="absolute -top-2.5 right-4 bg-violet-600 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                Most popular
              </span>
            )}
            <h3 className="text-white font-bold">{plan.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Monthly subscription</p>
            <div className="mb-2">
              <span className="text-3xl font-bold text-white">{moneyFromCents(plan.amountCents)}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">{perRenderLabel(code)}</p>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-muted-foreground">{plan.credits.toLocaleString("en-US")} credits per month</li>
              <li className="text-sm text-muted-foreground">Full-size PNG downloads</li>
              <li className="text-sm text-muted-foreground">Use renders in proposals, marketing &amp; ads</li>
            </ul>
            <Link
              href={`/onboarding?plan=${code}&step=3`}
              className="block text-center py-2 bg-gradient-to-r from-orange-500 to-violet-700 rounded-md text-white hover:opacity-90 transition-all"
            >
              Start with {plan.name}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

/** Phone-only sticky bar after scroll; sits above the footer without covering it. */
export function HomePhoneBottomBar({ variant }: { variant: HomeVariant }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 md:hidden border-t border-border bg-background/95 backdrop-blur px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex gap-2">
        <HomeCtaLink
          href={GUEST_STUDIO_HREF}
          variant={variant}
          destination="guest_studio"
          className="flex-1 text-center text-sm py-2.5 rounded-md bg-gradient-to-r from-orange-500 to-violet-700 text-white font-medium"
        >
          5 free renders
        </HomeCtaLink>
        <Link
          href="/gallery"
          className="flex-1 text-center text-sm py-2.5 rounded-md border border-border text-foreground font-medium"
        >
          Real projects
        </Link>
      </div>
    </div>
  )
}
