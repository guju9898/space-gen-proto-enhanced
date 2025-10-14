import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight, Menu } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/amethyst-flow.png" alt="Space Gen Logo" width={32} height={32} className="w-8 h-8" />
          <span className="font-bold text-lg text-white">Space Gen</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-white hover:text-primary/90">
            Home
          </Link>
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-white">
            Gallery
          </Link>
          {/* TODO: create /pricing page */}
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">
            Pricing
          </Link>
          {/* TODO: create /blog page */}
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-white">
            Blog
          </Link>
          {/* TODO: create /faq page */}
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-white">
            FAQ
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-white hover:text-primary/90">
            Login
          </Link>
          <Link
            href="/onboarding"
            className="text-sm bg-gradient-to-r from-[#9747ff] to-[#8608fd] hover:opacity-90 text-white px-4 py-2 rounded-md"
          >
            Sign Up
          </Link>
        </div>

        <button className="md:hidden text-white">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Redesign Your Space with AI</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Transform your living and commercial spaces with our AI-powered design tool. Get professional designs in
          minutes, not weeks.
        </p>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9747ff] to-[#8608fd] hover:opacity-90 text-white px-6 py-3 rounded-md font-medium"
        >
          Get Started <ChevronRight className="w-4 h-4" />
        </Link>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-16">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-md">
              <Image
                src={`/modern-living-space.png?height=200&width=200&query=interior design ${i + 1}`}
                alt={`Interior design ${i + 1}`}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Space Gen Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Space Gen:</h2>
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Transform, Redesign and Refine</h3>
        <h4 className="text-xl md:text-2xl font-bold mb-8 text-white">Your Personal and Commercial Spaces</h4>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
          Our AI-powered platform helps you visualize and transform any space with professional design recommendations
          tailored to your style and needs.
        </p>

        {/* Featured Images */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl overflow-hidden">
            <Image
              src="/sunlit-plant-filled-living-room.png"
              alt="Modern living room"
              width={600}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-xl overflow-hidden">
            <Image
              src="/cozy-cottage-garden.png"
              alt="House exterior"
              width={600}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white text-center">How It Works</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          Redesign your space in just four easy steps
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                1
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Choose Your Space</h3>
                <p className="text-muted-foreground text-sm">Upload photos of the room or space you want to redesign</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                2
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Select Your Style</h3>
                <p className="text-muted-foreground text-sm">
                  Choose from various design styles or create your own custom look
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                3
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Generate and Customize</h3>
                <p className="text-muted-foreground text-sm">
                  Our AI generates multiple design options that you can customize
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                4
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Download and Implement</h3>
                <p className="text-muted-foreground text-sm">Get detailed design plans and product recommendations</p>
              </div>
            </div>
          </div>

          <div className="bg-[#191f33] rounded-xl p-4">
            <Image
              src="/ai-design-transformation.png"
              alt="AI design interface"
              width={600}
              height={400}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

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
                  src="/placeholder.svg?height=24&width=24&query=home icon"
                  alt="Home icon"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-bold text-white">Home Owners</h3>
            </div>
            <p className="text-muted-foreground">
              Transform your living spaces with professional designs that match your style and budget. Get multiple
              design options for any room in your home.
            </p>
          </div>

          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <Image
                  src="/placeholder.svg?height=24&width=24&query=design icon"
                  alt="Design icon"
                  width={24}
                  height={24}
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
                  src="/placeholder.svg?height=24&width=24&query=real estate icon"
                  alt="Real estate icon"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-bold text-white">Real Estate Agents</h3>
            </div>
            <p className="text-muted-foreground">
              Help clients visualize properties with virtual staging. Show the potential of any space and close deals
              faster with impressive visualizations.
            </p>
          </div>

          <div className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] flex items-center justify-center">
                <Image
                  src="/placeholder.svg?height=24&width=24&query=architecture icon"
                  alt="Architecture icon"
                  width={24}
                  height={24}
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
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          Find the perfect plan for your design needs, from one-time projects to professional use
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Temporary Plan */}
          <div className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold">Temporary</h3>
                <p className="text-xs text-muted-foreground">One-time use</p>
              </div>
              <span className="px-2 py-1 bg-[#343434] rounded-full text-xs text-white">Basic</span>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">$9.99</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-muted-foreground">5 room designs</li>
              <li className="text-sm text-muted-foreground">Standard resolution</li>
              <li className="text-sm text-muted-foreground">Basic style options</li>
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 border border-[#343434] rounded-md text-white hover:bg-[#343434]/50 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Personal Plan */}
          <div className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434] relative">
            <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-[#9747ff] to-[#8608fd] rounded-full text-xs text-white">
              Popular
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold">Personal</h3>
                <p className="text-xs text-muted-foreground">Monthly subscription</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">$37.95</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-muted-foreground">20 room designs per month</li>
              <li className="text-sm text-muted-foreground">HD resolution</li>
              <li className="text-sm text-muted-foreground">Advanced style options</li>
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 bg-gradient-to-r from-[#9747ff] to-[#8608fd] rounded-md text-white hover:opacity-90 transition"
            >
              Get Started
            </Link>
          </div>

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
              <li className="text-sm text-muted-foreground">50 room designs per month</li>
              <li className="text-sm text-muted-foreground">4K resolution</li>
              <li className="text-sm text-muted-foreground">All style options</li>
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 border border-[#343434] rounded-md text-white hover:bg-[#343434]/50 transition"
            >
              Get Started
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
              <span className="text-3xl font-bold text-white">$249</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-muted-foreground">Unlimited room designs</li>
              <li className="text-sm text-muted-foreground">4K resolution</li>
              <li className="text-sm text-muted-foreground">Commercial license</li>
            </ul>
            <Link
              href="/onboarding"
              className="block text-center py-2 border border-[#343434] rounded-md text-white hover:bg-[#343434]/50 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white text-center">Customer Stories</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-center">
          See what our users are saying about Space Gen
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#191f33]/50 p-6 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={`/placeholder.svg?height=48&width=48&query=abstract avatar ${i}`}
                  alt={`Customer ${i}`}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h3 className="text-white font-medium">Customer Name</h3>
                  <p className="text-xs text-muted-foreground">Homeowner</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                "Space Gen transformed my living room completely! The AI suggestions were spot on with my style
                preferences, and I was able to implement the changes over a weekend. Highly recommend for anyone looking
                to refresh their space."
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-white text-center">FAQ</h2>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            "Questions about using Space Gen?",
            "How accurate are the AI designs?",
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
              Join thousands of satisfied customers who have transformed their spaces with our AI-powered design tool.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9747ff] to-[#8608fd] hover:opacity-90 text-white px-6 py-3 rounded-md font-medium"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/placeholder.svg?height=300&width=500&query=modern porch design with furniture"
              alt="Modern porch design"
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
              <Image src="/amethyst-flow.png" alt="Space Gen Logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-bold text-lg text-white">Space Gen</span>
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
            <p>© 2023 Space Gen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
