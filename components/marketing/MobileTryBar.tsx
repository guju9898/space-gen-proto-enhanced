"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

/** Phones only: a bottom bar with the free demo, shown once the hero buttons scroll away. */
export function MobileTryBar({ href = "/studio/exterior?demo=true" }: { href?: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  if (!show) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur md:hidden">
      <Link
        href={href}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-violet-700 py-3 text-sm font-semibold text-white"
      >
        Try free: 5 renders, no card <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
