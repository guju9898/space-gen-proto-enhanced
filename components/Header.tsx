"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, User } from "lucide-react"
import { cn } from "@/lib/utils"
import SpaceGenLogo from "@/components/SpaceGenLogo"

const navigation = [
  { name: "Studio", href: "/studio/interior" },
  { name: "My Projects", href: "/projects" },
  { name: "Subscription", href: "/subscription" }
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left - Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <SpaceGenLogo className="h-6 w-6" />
            <span className="font-semibold">Space Gen</span>
          </Link>
        </div>

        {/* Center - Navigation */}
        <nav className="flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80",
                pathname.startsWith(item.href)
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right - Language & Profile */}
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-sm font-medium text-foreground/60 hover:text-foreground/80">
            <Globe className="h-4 w-4" />
            <span>EN</span>
          </button>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-foreground/60" />
            <span className="text-sm font-medium">Martin</span>
          </div>
        </div>
      </div>
    </header>
  )
} 