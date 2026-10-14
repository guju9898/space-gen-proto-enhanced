"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { useAuth } from "@/components/auth/AuthContext"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { NAV_LINKS, type HeaderCta, type NavKey } from "./nav"

type MobileNavProps = {
  active?: NavKey
  cta: HeaderCta
}

/**
 * Mobile menu (below lg). Radix Dialog provides focus trap, Esc to close,
 * aria-expanded/aria-controls on the trigger, and focus return on close.
 */
export function MobileNav({ active, cta }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const { openLoginModal } = useAuth()

  const handleLogin = () => {
    // Close the sheet first so two modal dialogs don't fight over focus.
    setOpen(false)
    window.setTimeout(() => openLoginModal(), 150)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="lg:hidden text-white p-2 -mr-2 rounded-md hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-6 border-[#343434] bg-background">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav aria-label="Mobile" className="mt-8 flex flex-col">
          {NAV_LINKS.map((link) => {
            const isActive = link.key === active
            return (
              <SheetClose asChild key={link.key}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`py-3 text-base border-b border-white/10 ${
                    isActive ? "text-white font-medium" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              </SheetClose>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full text-sm text-white border border-white/30 hover:bg-white/10 px-4 py-3 rounded-md"
          >
            Log in
          </button>
          <SheetClose asChild>
            <Link
              href={cta.href}
              className="w-full text-center text-sm bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white px-4 py-3 rounded-md"
            >
              {cta.label}
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
