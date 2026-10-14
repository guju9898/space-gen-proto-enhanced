import Image from "next/image"
import Link from "next/link"
import { LoginButton } from "@/components/auth/LoginButton"
import { MobileNav } from "./MobileNav"
import { DEFAULT_CTA, NAV_LINKS, type HeaderCta, type NavKey } from "./nav"

type SiteHeaderProps = {
  /** Highlights the current page in the nav. */
  active?: NavKey
  cta?: HeaderCta
}

/**
 * Shared header for marketing pages. Server component: the desktop links are
 * always in the HTML (hidden with CSS below lg) so crawlers see every link.
 * Below lg, MobileNav opens a sheet with the same links.
 */
export function SiteHeader({ active, cta = DEFAULT_CTA }: SiteHeaderProps) {
  return (
    <header className="container mx-auto py-4 px-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/amethyst-flow.png" alt="Renderspace logo" width={32} height={32} className="w-8 h-8" />
        <span className="font-bold text-lg text-white">Renderspace</span>
      </Link>

      <nav aria-label="Main" className="hidden lg:flex items-center gap-7">
        {NAV_LINKS.map((link) => {
          const isActive = link.key === active
          return (
            <Link
              key={link.key}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "text-sm text-white hover:text-primary/90"
                  : "text-sm text-muted-foreground hover:text-white"
              }
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="hidden lg:flex items-center gap-4">
        <LoginButton />
        <Link
          href={cta.href}
          className="text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-4 py-2 rounded-md"
        >
          {cta.label}
        </Link>
      </div>

      <MobileNav active={active} cta={cta} />
    </header>
  )
}
