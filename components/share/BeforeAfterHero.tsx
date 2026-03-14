"use client"

import { useRef, useState, useCallback } from "react"
import Image from "next/image"

const FALLBACK_BEFORE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect fill='%23333' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='24'%3EBefore%3C/text%3E%3C/svg%3E"

export interface BeforeAfterHeroProps {
  /** Before (source) image URL; uses placeholder if not provided */
  beforeImageUrl?: string | null
  /** After (concept) image URL */
  afterImageUrl: string
  /** Alt text for before image */
  beforeAlt?: string
  /** Alt text for after image */
  afterAlt?: string
}

export function BeforeAfterHero({
  beforeImageUrl,
  afterImageUrl,
  beforeAlt = "Before",
  afterAlt = "Concept Design",
}: BeforeAfterHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50) // percentage 0–100
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = useCallback(
    (clientX: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      setPosition((x / rect.width) * 100)
    },
    []
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      updatePosition(e.clientX)
    },
    [isDragging, updatePosition]
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  return (
    <section className="relative w-full bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div
          ref={containerRef}
          className="relative aspect-[4/3] sm:aspect-[16/10] max-w-5xl mx-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl select-none touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: "none" }}
        >
          {/* Before (full width, under) */}
          <div className="absolute inset-0">
            <Image
              src={beforeImageUrl || FALLBACK_BEFORE}
              alt={beforeAlt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 1024px, 100vw"
              priority
              unoptimized={!beforeImageUrl}
            />
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/60 text-white/90 text-xs font-medium">
              Before
            </div>
          </div>

          {/* After (clipped by position) */}
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <Image
              src={afterImageUrl}
              alt={afterAlt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 1024px, 100vw"
              priority
            />
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/60 text-white/90 text-xs font-medium">
              Concept Design
            </div>
          </div>

          {/* Slider line + handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white/90 z-10 cursor-ew-resize"
            style={{ left: `${position}%`, transform: "translateX(-50%)" }}
            onPointerDown={handlePointerDown}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <span className="w-0.5 h-3 bg-neutral-700 rounded" />
                <span className="w-0.5 h-3 bg-neutral-700 rounded" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-white/50">
          Concept visualization generated in seconds.
        </p>
        <p className="mt-1 text-center text-xs text-white/40">
          Concept generated in ~30 seconds using AI design visualization.
        </p>
      </div>
    </section>
  )
}
