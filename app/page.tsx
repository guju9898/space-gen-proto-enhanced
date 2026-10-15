import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { softwareApplicationLd } from "@/lib/seo/schema"
import { PLANS, PROOF, usd } from "@/lib/seo/facts"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Suspense } from "react"
import { ChevronRight } from "lucide-react"
import { LoginRedirectHandler } from "@/components/auth/LoginRedirectHandler"
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated"
import ComparisonTable from "@/components/ComparisonTable"
import { RenderspaceBeforeAfterSlider } from "@/components/RenderspaceBeforeAfterSlider"
import RoiCalculator from "@/components/RoiCalculator"
import { HomepageFAQ } from "@/components/HomepageFAQ"
import { SiteFooter } from "@/components/site/SiteFooter"

export const metadata: Metadata = pageMetadata({
  path: "/",
  title: "Renderspace: AI Renderings From a Job-Site Photo",
  description:
    "Turn a job-site photo into a photorealistic backyard, patio, exterior or interior concept in about 30 seconds and show clients the result before you quote.",
  absoluteTitle: true,
})

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={softwareApplicationLd()} />
      <Suspense fallback={null}>
        <RedirectIfAuthenticated />
      </Suspense>
      <Suspense fallback={null}>
        <LoginRedirectHandler />
      </Suspense>
      <SiteHeader active="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <p className="text-sm font-medium text-primary mb-4">
          For pool builders, landscape and outdoor-living contractors, remodelers and designers
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          Show Clients the Finished Project Before You Quote
          <span className="block mt-2 text-2xl md:text-3xl font-semibold text-white/90">
            AI renderings from a job-site photo in about {PROOF.secondsPerConcept.typical} seconds
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Renderspace turns a photo of your client&apos;s yard, home or room into a photorealistic concept: a new
          pool, patio, outdoor kitchen, facade or interior. Show it on the spot and lock in the direction before
          anyone prices the job.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/onboarding?plan=starter"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
          >
            Try {PLANS.starter.credits} Credits for {usd(PLANS.starter.priceUsd)} <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center border border-white/30 hover:bg-white/10 transition-all text-white px-6 py-3 rounded-md font-medium"
          >
            See Real Examples
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-semibold text-white">{PROOF.rendersGenerated}+</span> renders generated
          </li>
          <li>
            <span className="font-semibold text-white">~{PROOF.secondsPerConcept.typical} sec</span> from photo to concept
          </li>
          <li>Works from a phone photo</li>
        </ul>

        {/* Featured Renders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto">
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/landing/renders/exterior-hero-01.png"
              alt="AI rendering of a limestone home with a lap pool and stone pool deck, generated in Renderspace"
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/landing/renders/landscape-hero-01.png"
              alt="AI landscape rendering of a modern home with a curving flagstone path and native planting"
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/landing/renders/interior-hero-01.png"
              alt="AI interior rendering of a bright open-plan living room and kitchen"
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">All images generated in Renderspace</p>
      </section>

      {/* Space Gen Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">One photo in, a client-ready concept out</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Drag the slider to compare real before-and-after results for a backyard, a home exterior and an interior.
          Each one was generated from a single photo.
        </p>

        {/* Featured Before / After Slider */}
        <div className="mb-8">
          <RenderspaceBeforeAfterSlider />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white text-center">How It Works</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          From a job-site photo to client sign-off on direction, in four steps
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                1
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Start from real constraints</h3>
                <p className="text-muted-foreground text-sm">Take a photo on site (a phone photo works) and choose the space type: landscape, exterior or interior.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                2
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Explore multiple directions instantly</h3>
                <p className="text-muted-foreground text-sm">
                  Adjust style, mood, and key variables to generate multiple design directions in seconds.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                3
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Show options live with clients</h3>
                <p className="text-muted-foreground text-sm">
                  Generate and compare concepts in real time to guide conversations and get early buy-in.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                4
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Lock direction before committing</h3>
                <p className="text-muted-foreground text-sm">Use aligned concepts as a visual reference before moving into detailed plans, pricing, or construction.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#191f33] rounded-xl p-4">
            <Image
              src="/landing/renders/studio-ui.png"
              alt="Renderspace Studio interface"
              width={600}
              height={400}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Live Product Demo Video */}
      <section className="container mx-auto px-4 py-16">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide text-center mb-2">
          Live product demo: the actual Renderspace interface
        </p>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">
          See How Renderspace Works in 30 Seconds
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-center">
          Generate client-ready design concepts from real photos in seconds.
        </p>
        <div className="max-w-[900px] mx-auto rounded-xl overflow-hidden border border-white/10 shadow-lg">
          <video
            autoPlay
            loop
            muted
            playsInline
            controls
            className="w-full h-auto"
            src="/videos/renderspace-demo.mp4"
            title="Renderspace product demo"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      <ComparisonTable />

      {/* Who uses Renderspace */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Who uses Renderspace</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          Built for people who sell projects clients can&apos;t picture yet, outdoors first and indoors too.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <Image src="/landing/renders/exterior-hero-01.png" alt="" width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
              <h3 className="text-xl font-bold text-white">Pool builders and outdoor-living contractors</h3>
            </div>
            <p className="text-muted-foreground">Show the pool, deck, pergola or outdoor kitchen on the customer&apos;s own backyard during the first visit, before you price the job.</p>
          </div>
          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <Image src="/landing/renders/landscape-hero-01.png" alt="" width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
              <h3 className="text-xl font-bold text-white">Landscape and hardscape contractors</h3>
            </div>
            <p className="text-muted-foreground">Turn a photo of a bare or tired yard into planting, paver, path and lighting concepts the homeowner can react to on the spot.</p>
          </div>
          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <Image src="/landing/renders/cta-render-01.png" alt="" width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
              <h3 className="text-xl font-bold text-white">Remodelers and home builders</h3>
            </div>
            <p className="text-muted-foreground">Preview new siding, roofing, entries and exterior finishes on the real house so clients commit to a direction faster.</p>
          </div>
          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <Image src="/landing/renders/interior-hero-01.png" alt="" width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
              <h3 className="text-xl font-bold text-white">Interior designers</h3>
            </div>
            <p className="text-muted-foreground">Explore layouts, palettes and furnishings from a photo of the actual room and present several directions in minutes.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          Find the perfect plan for your design needs, from one-time projects to professional use
        </p>

        {/* Tripwire Banner */}
        <div className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/60 p-5 mb-6 text-center relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
            First Job Test
          </span>
          <p className="text-sm text-muted-foreground">
            New here? Try Renderspace on a real job for <span className="font-semibold text-white">$19.99</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">40 credits • 7 days • perfect for your next estimate</p>
          <p className="text-xs text-muted-foreground mt-2">Automatically upgrades to Professional if you decide to continue.</p>
          <Link
            href="/onboarding?plan=starter"
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Try 40 Credits for $19.99
          </Link>
        </div>

        {/* Value Anchor Block */}
        <div className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33] p-6 mb-10 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-white">
            One render can help close a <span className="font-semibold text-white">$20,000</span> project
          </h3>
          <p className="text-muted-foreground mt-2">
            Renderspace costs less than <span className="font-semibold text-white">0.5%</span> of a single job.
          </p>
        </div>

        {/* ROI Calculator */}
        <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center">
          What could one better closing rate mean for your business?
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-center">
          Even small improvements in client visualization can dramatically increase project approvals.
        </p>
        <RoiCalculator ctaHref="/onboarding?plan=starter" ctaLabel={`Try ${PLANS.starter.credits} Credits for ${usd(PLANS.starter.priceUsd)}`} />

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Professional Plan */}
          <div className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold">Professional</h3>
                <p className="text-xs text-muted-foreground">Monthly subscription</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">$99</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-muted-foreground">500 generations / credits per month</li>
              <li className="text-sm text-muted-foreground">4K resolution</li>
              <li className="text-sm text-muted-foreground">All style options</li>
              <li className="text-sm text-muted-foreground">Use renders in proposals, marketing &amp; ads</li>
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 bg-gradient-to-r from-orange-500 to-violet-700 rounded-md text-white hover:opacity-90 transition-all"
            >
              Start with Professional
            </Link>
          </div>

          {/* Business Plan */}
          <div className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold">Business</h3>
                <p className="text-xs text-muted-foreground">Monthly subscription</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">$349</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-muted-foreground">6,000 generations / credits per month</li>
              <li className="text-sm text-muted-foreground">4K resolution</li>
              <li className="text-sm text-muted-foreground">All style options</li>
              <li className="text-sm text-muted-foreground">Use renders in proposals, marketing &amp; ads</li>
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 bg-gradient-to-r from-orange-500 to-violet-700 rounded-md text-white hover:opacity-90 transition-all"
            >
              Start with Business
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Customer Stories</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          What contractors say after using Renderspace on real jobs
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <span className="text-white font-bold text-lg">CH</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Codey H</h3>
                <p className="text-xs text-muted-foreground">Principal, CC Homes</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              &ldquo;Renderspace has been great at helping us put together mood boards in a fraction [of] the time and costs as the Fiverr workers we used to use!&rdquo;
            </p>
          </div>

          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <span className="text-white font-bold text-lg">AR</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Angel R</h3>
                <p className="text-xs text-muted-foreground">Project Manager, Texas Backyard Kings</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              &ldquo;[We&apos;re] showing customers concepts for their project on site rather than the back and forth with our in house design team. We&apos;ve saved hours of rework.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Expectations Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center">What Renderspace is (and isn&apos;t) for</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          Renderspace is designed to support early decision-making — not replace detailed design work.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-[#191f33]/50 p-6 rounded-xl border border-[#343434]">
            <h3 className="text-xl font-bold text-white mb-4">Best Used For</h3>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">Early-stage design concepts</li>
              <li className="text-sm text-muted-foreground">Client alignment and approvals</li>
              <li className="text-sm text-muted-foreground">Exploring multiple visual directions quickly</li>
              <li className="text-sm text-muted-foreground">Sales conversations and project scoping</li>
            </ul>
          </div>

          <div className="bg-[#191f33]/50 p-6 rounded-xl border border-[#343434]">
            <h3 className="text-xl font-bold text-white mb-4">Not Intended For</h3>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">Construction drawings or permit plans</li>
              <li className="text-sm text-muted-foreground">Final material specifications</li>
              <li className="text-sm text-muted-foreground">Engineering or architectural documentation</li>
              <li className="text-sm text-muted-foreground">Build-ready plans</li>
            </ul>
          </div>
        </div>
      </section>

      <HomepageFAQ />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-[#9747ff]/20 to-[#8608fd]/20 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Try it on your next estimate</h2>
            <p className="text-muted-foreground mb-6">
              {PLANS.starter.credits} credits, {PLANS.starter.period}, {usd(PLANS.starter.priceUsd)}. Take a photo at your
              next walkthrough and show the client what their project could look like before you leave.
            </p>
            <Link
              href="/onboarding?plan=starter"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
            >
              Start the First Job Test <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/landing/renders/cta-render-01.png"
              alt="AI rendering of a covered patio with outdoor seating and a stepping-stone path"
              width={500}
              height={300}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
