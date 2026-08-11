import Image from "next/image"
import Link from "next/link"

export function BlogHeader({ active = "blog" }: { active?: "blog" | "other" }) {
  return (
    <header className="container mx-auto py-4 px-4 flex items-center justify-between">
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

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-white">
          Home
        </Link>
        <Link
          href="/blog"
          className={
            active === "blog"
              ? "text-sm text-white hover:text-primary/90"
              : "text-sm text-muted-foreground hover:text-white"
          }
        >
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
      </nav>

      <div className="hidden md:flex items-center gap-4">
        <Link href="/?login=1" className="text-sm text-white hover:text-primary/90">
          Log in
        </Link>
        <Link
          href="/onboarding?plan=starter"
          className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-2 rounded-md"
        >
          First Job Test
        </Link>
      </div>
    </header>
  )
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
