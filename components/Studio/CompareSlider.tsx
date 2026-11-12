"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Before/after for one render: the site photo under, the render on top, clipped at the
 * handle. Plain <img> so any URL works (the homepage slider uses next/image presets).
 * Keyboard and screen readers use the range input; pointers can drag anywhere.
 */
export function CompareSlider({
  beforeSrc,
  afterSrc,
  className,
}: {
  beforeSrc: string
  afterSrc: string
  className?: string
}) {
  const [pos, setPos] = useState(50)

  const setFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    setPos(Math.max(0, Math.min(100, pct)))
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-md bg-muted"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setFromPointer(e)
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e)
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt="Site photo" className="block max-h-[70dvh] w-full object-contain" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterSrc}
          alt="Render"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50" />
        </div>
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Photo</span>
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Render</span>
      </div>
      <label className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="shrink-0">Photo</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Compare photo and render"
        />
        <span className="shrink-0">Render</span>
      </label>
    </div>
  )
}
