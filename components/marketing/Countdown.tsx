"use client"

import { useEffect, useState } from "react"

/** Remaining time to a fixed end date. Returns null once it has passed. */
export function remainingParts(endIso: string, now: number): { d: number; h: number; m: number; s: number } | null {
  const ms = Date.parse(endIso) - now
  if (!Number.isFinite(ms) || ms <= 0) return null
  const total = Math.floor(ms / 1000)
  return { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 }
}

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * Live countdown to a real campaign end date. Renders nothing until mounted (no
 * server/client mismatch) and nothing after the end. `onEnd` lets the parent hide.
 */
export function Countdown({ endsAt, className, onEnd }: { endsAt: string; className?: string; onEnd?: () => void }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const parts = now === null ? null : remainingParts(endsAt, now)
  useEffect(() => {
    if (now !== null && !parts) onEnd?.()
  }, [now, parts, onEnd])
  if (!parts) return null
  return (
    <span className={className} role="timer" aria-label="Time left in the offer">
      {parts.d > 0 && <>{parts.d}d </>}
      {pad(parts.h)}h {pad(parts.m)}m {pad(parts.s)}s
    </span>
  )
}
