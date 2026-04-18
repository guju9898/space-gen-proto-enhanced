import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/amethyst-flow.png" alt="Renderspace Logo" width={32} height={32} className="w-8 h-8" />
          <span className="font-bold text-lg text-white">Renderspace</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-white">
            Home
          </Link>
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-white">
            Gallery
          </Link>
          <Link href="/pricing" className="text-sm text-white hover:text-primary/90">
            Pricing
          </Link>
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-white">
            FAQ
          </Link>
          <Link href="/contractor-demo" className="text-sm text-muted-foreground hover:text-white">
            Demo
          </Link>
          <Link href="/mockup-method" className="text-sm text-muted-foreground hover:text-white">
            Mockup Method
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/?login=1" className="text-sm text-white hover:text-primary/90">
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-2 rounded-md"
          >
            Redesign Now
          </Link>
        </div>
      </header>

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

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 bg-gradient-to-r from-orange-500 to-violet-700 rounded-md text-white hover:opacity-90 transition-all"
            >
              Redesign Your Space
            </Link>
          </div>

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
              <li className="text-sm text-muted-foreground">6000 generations / credits per month</li>
              <li className="text-sm text-muted-foreground">4K resolution</li>
              <li className="text-sm text-muted-foreground">Commercial license</li>
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 bg-gradient-to-r from-orange-500 to-violet-700 rounded-md text-white hover:opacity-90 transition-all"
            >
              Redesign Your Space
            </Link>
          </div>
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
      <footer className="bg-[#101010] border-t border-[#343434] py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <Link href="/" className="flex items-center gap-2 mb-4 md:mb-0">
              <Image src="/amethyst-flow.png" alt="Renderspace Logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-bold text-lg text-white">Renderspace</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">
                Pricing
              </Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-white">
                FAQ
              </Link>
              <Link href="/gallery" className="text-sm text-muted-foreground hover:text-white">
                Gallery
              </Link>
            </nav>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            <p>© 2024 Renderspace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
