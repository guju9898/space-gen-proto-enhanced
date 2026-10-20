import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { LIVE_PROFILES } from "@/lib/seo/facts"

const FOOTER_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/gallery", label: "Gallery" },
  { href: "/human-polish", label: "Human Polish™" },
  { href: "/academy", label: "Academy" },
  { href: "/affiliates", label: "Affiliates" },
]

function InstagramIcon() {
  return (
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
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

/** Shared marketing footer. Profiles come from SOCIAL_PROFILES in lib/seo/facts.ts. */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`bg-[#101010] border-t border-[#343434] py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/amethyst-flow.png" alt="Renderspace Logo" width={32} height={32} className="w-8 h-8" />
            <span className="font-bold text-lg text-white">Renderspace</span>
          </Link>

          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-6">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>

          {LIVE_PROFILES.length > 0 && (
            <div className="flex items-center gap-4">
              {LIVE_PROFILES.map((p) => (
                <a
                  key={p.key}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={p.key === "instagram" ? "Renderspace on Instagram" : `Renderspace reviews on ${p.name}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white"
                >
                  {p.key === "instagram" ? (
                    <InstagramIcon />
                  ) : (
                    <>
                      <Star className="w-4 h-4" aria-hidden="true" />
                      <span>{p.name}</span>
                    </>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Renderspace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
