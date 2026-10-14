import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site/SiteHeader"

export function BlogHeader() {
  return <SiteHeader active="blog" cta={{ href: "/onboarding?plan=starter", label: "First Job Test" }} />
}

export function BlogFooter() {
  return (
    <footer className="bg-[#101010] border-t border-[#343434] py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/amethyst-flow.png"
              alt="Renderspace Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-bold text-lg text-white">Renderspace</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-6">
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-white">
              Blog
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">
              Pricing
            </Link>
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-white">
              FAQ
            </Link>
            <Link
              href="/human-polish"
              className="text-sm text-muted-foreground hover:text-white"
            >
              Human Polish™
            </Link>
            <Link href="/gallery" className="text-sm text-muted-foreground hover:text-white">
              Gallery
            </Link>
          </nav>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Renderspace. Visualization for contractors — not architecture,
          engineering, or permit documentation.
        </p>
      </div>
    </footer>
  )
}
