import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const faqs = [
  {
    q: "What is Renderspace?",
    a: "Renderspace is an AI-powered design tool that turns photos of real spaces into client-ready interior, exterior, and landscape concepts. Upload a photo, choose a style, and get high-resolution visuals in minutes.",
  },
  {
    q: "How do credits work?",
    a: "Each AI-generated image uses one credit. Professional plans include 500 credits per month; Business plans include 6,000. Unused credits do not roll over. You can upgrade or downgrade your plan at any time.",
  },
  {
    q: "What resolution are the images?",
    a: "All plans include 4K (3840x2160) export so your renders are print- and presentation-ready. Downloads are available in standard image formats.",
  },
  {
    q: "Can I use renders commercially?",
    a: "Yes. The Business plan includes a commercial license so you can use generated images in client proposals, marketing, and paid projects. The Professional plan is for personal and internal use.",
  },
  {
    q: "Is my data secure?",
    a: "We process uploads and store assets securely. We do not train our AI on your images or share your data with third parties. Payments are handled by Stripe.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There is no long-term commitment. You can cancel from your account settings, and you will keep access until the end of your billing period.",
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/amethyst-flow.png" alt="Renderspace Logo" width={32} height={32} className="w-8 h-8" />
          <span className="font-bold text-lg text-white">Renderspace</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-white">Home</Link>
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-white">Gallery</Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">Pricing</Link>
          <Link href="/faq" className="text-sm text-white hover:text-primary/90">FAQ</Link>
          <Link href="/contractor-demo" className="text-sm text-muted-foreground hover:text-white">Demo</Link>
          <Link href="/mockup-method" className="text-sm text-muted-foreground hover:text-white">Mockup Method</Link>
          <Link href="/human-polish" className="text-sm text-muted-foreground hover:text-white">Human Polish™</Link>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-white">Blog</Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/?login=1" className="text-sm text-white hover:text-primary/90">Log in</Link>
          <Link href="/onboarding" className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-2 rounded-md">Redesign Now</Link>
        </div>
      </header>
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Frequently asked questions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to know about Renderspace.</p>
      </section>
      <section className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434]">
              <h2 className="text-lg font-bold text-white mb-3">{faq.q}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-12 text-muted-foreground">
          Still have questions? <Link href="/pricing" className="text-primary hover:underline inline-flex items-center gap-1">View pricing <ChevronRight className="w-4 h-4" /></Link>
        </p>
      </section>
      <footer className="bg-[#101010] border-t border-[#343434] py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <Link href="/" className="flex items-center gap-2 mb-4 md:mb-0">
              <Image src="/amethyst-flow.png" alt="Renderspace Logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-bold text-lg text-white">Renderspace</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-white">Blog</Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">Pricing</Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-white">FAQ</Link>
              <Link href="/gallery" className="text-sm text-muted-foreground hover:text-white">Gallery</Link>
              <Link href="/human-polish" className="text-sm text-muted-foreground hover:text-white">Human Polish™</Link>
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
