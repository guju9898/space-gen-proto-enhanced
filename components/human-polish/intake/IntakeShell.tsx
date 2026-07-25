"use client"

/**
 * Human Polish™ intake — page chrome that matches the marketing page header/footer.
 */

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

export function IntakeShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/amethyst-flow.png"
              alt="Renderspace"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-lg font-bold text-white">Renderspace</span>
          </Link>
          <Link
            href="/human-polish"
            className="text-sm text-muted-foreground transition-colors hover:text-white"
          >
            ← Back to Human Polish™
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto w-full max-w-4xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Link href="/" className="transition-colors hover:text-white">
            Renderspace
          </Link>
          {" · "}
          <Link href="/pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
          {" · "}
          <Link href="/human-polish" className="transition-colors hover:text-white">
            Human Polish™
          </Link>
        </div>
      </footer>
    </div>
  )
}
