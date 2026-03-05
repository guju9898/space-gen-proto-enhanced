import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { ChevronDown, ChevronRight, Menu } from "lucide-react"
import { LoginButton } from "@/components/auth/LoginButton"
import { LoginRedirectHandler } from "@/components/auth/LoginRedirectHandler"
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated"
import ComparisonTable from "@/components/ComparisonTable"
import { RenderspaceBeforeAfterSlider } from "@/components/RenderspaceBeforeAfterSlider"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={null}>
        <RedirectIfAuthenticated />
      </Suspense>
      <Suspense fallback={null}>
        <LoginRedirectHandler />
      </Suspense>
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/amethyst-flow.png" alt="Renderspace Logo" width={32} height={32} className="w-8 h-8" />
          <span className="font-bold text-lg text-white">Renderspace</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-white hover:text-primary/90">
            Home
          </Link>
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-white">
            Gallery
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">
            Pricing
          </Link>
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-white">
            FAQ
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LoginButton />
          <Link
            href="/onboarding"
            className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-4 py-2 rounded-md"
          >
            Redesign Now
          </Link>
        </div>

        <button className="md:hidden text-white">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Visualize in Seconds. Win More Projects</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Create client-ready interior, exterior, and landscape concepts in minutes — before plans, permits, or materials.
        </p>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
        >
          Redesign Your Space <ChevronRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-muted-foreground mt-3 text-center">No credit card required</p>

        {/* Featured Renders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto">
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/landing/renders/interior-hero-01.png"
              alt="Interior render"
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/landing/renders/exterior-hero-01.png"
              alt="Exterior render"
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/landing/renders/landscape-hero-01.png"
              alt="Landscape render"
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">Generated in Renderspace AI</p>
      </section>

      {/* Space Gen Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Renderspace:</h2>
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Transform, Redesign and Refine</h3>
        <h4 className="text-xl md:text-2xl font-bold mb-8 text-white">Your Personal and Commercial Spaces</h4>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
          Our AI-powered platform helps you create professional design visualizations quickly. Generate concept renders
          tailored to your project needs.
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
          From concept to client alignment in minutes
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                1
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Start from real constraints</h3>
                <p className="text-muted-foreground text-sm">Upload a photo or reference and define the type of space you're working with — interior, exterior, or landscape.</p>
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
          Live Product Demo / Actual Renderspace Interface (Sneak Peak)
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

      {/* Design for AI Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary text-center">Design for AI:</h2>
        <h3 className="text-2xl md:text-3xl font-bold mb-8 text-white text-center">
          AI Solutions to Transform Your Space
        </h3>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <Image
                  src="/landing/renders/interior-hero-01.png"
                  alt="Interior design"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-white">Interior Designers</h3>
            </div>
            <p className="text-muted-foreground">
              Enhance your workflow and create stunning visualizations for clients in minutes. Explore more design
              variations and increase productivity.
            </p>
          </div>

          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <Image
                  src="/landing/renders/exterior-hero-01.png"
                  alt="Exterior design"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-white">Contractors</h3>
            </div>
            <p className="text-muted-foreground">
              Quickly generate concept visualizations to align with clients before breaking ground. Speed up project
              approvals and reduce rework.
            </p>
          </div>

          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <Image
                  src="/landing/renders/landscape-hero-01.png"
                  alt="Landscape design"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-white">Landscapers</h3>
            </div>
            <p className="text-muted-foreground">
              Show clients outdoor design concepts on-site during consultations. Close more deals with instant
              visualizations that demonstrate potential.
            </p>
          </div>

          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <Image
                  src="/landing/renders/exterior-hero-01.png"
                  alt="Architecture"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-white">Architects</h3>
            </div>
            <p className="text-muted-foreground">
              Visualize architectural concepts and present them to clients with photorealistic renderings. Iterate
              designs quickly and efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          Find the perfect plan for your design needs, from one-time projects to professional use
        </p>

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
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 bg-gradient-to-r from-orange-500 to-violet-700 rounded-md text-white hover:opacity-90 transition-all"
            >
              Redesign Your Space
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

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Customer Stories</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          See what our users are saying about Renderspace
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
              "Renderspace has been great at helping us put together mood boards in a fraction on the time and costs as the Fiverr workers we used to use!"
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
              "I've been able to double last years deal flow by showing customers concepts for their project on site rather than the back and forth with our in house design team. We've saved hours of rework and on track to add 50% revenue"
            </p>
          </div>
        </div>
      </section>

      {/* Expectations Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center">Set Clear Expectations</h2>
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
              <li className="text-sm text-muted-foreground">Construction drawings or permits</li>
              <li className="text-sm text-muted-foreground">Final material specifications</li>
              <li className="text-sm text-muted-foreground">Engineering or architectural documentation</li>
              <li className="text-sm text-muted-foreground">Build-ready plans</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-white text-center">FAQ</h2>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            "Questions about using Renderspace?",
            "What is Renderspace best used for?",
            "Can I customize the generated designs?",
            "What file formats do you support?",
            "How many designs can I generate?",
            "Can I use the designs commercially?",
            "What payment methods do you accept?",
            "Can I cancel my subscription?",
          ].map((question, i) => (
            <div key={i} className="border border-[#343434] rounded-lg overflow-hidden">
              <button className="w-full flex justify-between items-center p-4 text-left text-white">
                <span>{question}</span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-[#9747ff]/20 to-[#8608fd]/20 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Don't wait to Create.</h2>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Start Designing Your Ideal Space Now!</h3>
            <p className="text-muted-foreground mb-6">
              Join professionals using Renderspace to create concept visualizations and align with clients faster.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
            >
              Redesign Your Space <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/landing/renders/cta-render-01.png"
              alt="Renderspace render"
              width={500}
              height={300}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#101010] border-t border-[#343434] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image src="/amethyst-flow.png" alt="Renderspace Logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-bold text-lg text-white">Renderspace</span>
            </div>

            <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
              <Link href="#privacy" className="text-sm text-muted-foreground hover:text-white">
                Privacy Policy
              </Link>
              <Link href="#terms" className="text-sm text-muted-foreground hover:text-white">
                Terms of Service
              </Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-white">
                About
              </Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-white">
                Contact
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-white">
                Pricing
              </Link>
              <Link href="#faq" className="text-sm text-muted-foreground hover:text-white">
                FAQ
              </Link>
            </nav>

            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>© 2023 Renderspace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
