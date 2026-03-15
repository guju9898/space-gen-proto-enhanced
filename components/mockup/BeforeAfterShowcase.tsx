"use client"

import { useRef, useState, useCallback } from "react"
import Image from "next/image"

const BEFORE_SRC = "/images/before-landscape.webp"
const AFTER_SRC = "/images/after-landscape.webp"

export function BeforeAfterShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons !== 1) return
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
          <Image
            src={BEFORE_SRC}
            alt="Job site photo"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/60 text-white text-xs font-medium">
            Job site
          </span>
        </div>
        <div
          ref={containerRef}
          className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg select-none touch-none"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={(e) => (e.target as HTMLElement).releasePointerCapture?.(e.pointerId)}
          onPointerLeave={(e) => (e.target as HTMLElement).releasePointerCapture?.(e.pointerId)}
          style={{ touchAction: "none" }}
        >
          <div className="absolute inset-0">
            <Image
              src={BEFORE_SRC}
              alt="Before"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <Image
              src={AFTER_SRC}
              alt="Generated render"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
            style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-neutral-700 text-sm">
              ⟷
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Generated in seconds with Renderspace
      </p>
    </section>
  )
}
