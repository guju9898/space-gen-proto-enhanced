"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

type DefaultCategoryKey = "landscape" | "exterior" | "interior"

export type BeforeAfterCategoryItem = {
  label: string
  beforeSrc: string
  afterSrc: string
}

const DEFAULT_CATEGORY_CONFIG: Record<DefaultCategoryKey, BeforeAfterCategoryItem> = {
  landscape: {
    label: "Landscape",
    beforeSrc: "/images/before-landscape.webp",
    afterSrc: "/images/after-landscape.webp",
  },
  exterior: {
    label: "Exterior",
    beforeSrc: "/images/before-exterior.webp",
    afterSrc: "/images/after-exterior.webp",
  },
  interior: {
    label: "Interior",
    beforeSrc: "/images/before-interior.webp",
    afterSrc: "/images/after-interior.webp",
  },
}

const DEFAULT_CATEGORY_ORDER: DefaultCategoryKey[] = ["landscape", "exterior", "interior"]

export interface RenderspaceBeforeAfterSliderProps {
  /** When set (e.g. contractor demo), tabs and image pairs come from this map instead of the homepage defaults. */
  categories?: Record<string, BeforeAfterCategoryItem>
  /** Tab order; should list every key in `categories` when using custom categories. */
  categoryOrder?: string[]
}

export function RenderspaceBeforeAfterSlider({
  categories: categoriesProp,
  categoryOrder: categoryOrderProp,
}: RenderspaceBeforeAfterSliderProps = {}) {
  const categoryConfig: Record<string, BeforeAfterCategoryItem> = (categoriesProp ??
    DEFAULT_CATEGORY_CONFIG) as Record<string, BeforeAfterCategoryItem>
  const categoryOrder = useMemo(() => {
    if (categoriesProp) {
      if (categoryOrderProp?.length) return categoryOrderProp
      return Object.keys(categoriesProp)
    }
    return DEFAULT_CATEGORY_ORDER as string[]
  }, [categoriesProp, categoryOrderProp])

  const initialKey = categoryOrder[0] ?? "landscape"

  const [activeCategory, setActiveCategory] = useState<string>(initialKey)
  const [sliderPosition, setSliderPosition] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [hasNudged, setHasNudged] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [isFading, setIsFading] = useState(false)

  const sliderRef = useRef<HTMLDivElement | null>(null)

  const currentCategory = categoryConfig[activeCategory] ?? categoryConfig[initialKey]

  const updateSliderFromClientX = (clientX: number) => {
    const slider = sliderRef.current
    if (!slider) return
    const rect = slider.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const ratio = Math.min(Math.max(offsetX / rect.width, 0), 1)
    setSliderPosition(ratio)
  }

  const beginInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true)
    }
    if (showHint) {
      setShowHint(false)
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    beginInteraction()
    setIsDragging(true)
    updateSliderFromClientX(event.clientX)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    event.preventDefault()
    updateSliderFromClientX(event.clientX)
  }

  const endMouseDrag = () => {
    if (isDragging) {
      setIsDragging(false)
    }
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    beginInteraction()
    setIsDragging(true)
    const touch = event.touches[0]
    if (touch) {
      updateSliderFromClientX(touch.clientX)
    }
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const touch = event.touches[0]
    if (touch) {
      updateSliderFromClientX(touch.clientX)
    }
  }

  const endTouchDrag = () => {
    if (isDragging) {
      setIsDragging(false)
    }
  }

  useEffect(() => {
    if (!showHint) return
    const timeout = setTimeout(() => {
      setShowHint(false)
    }, 4000)
    return () => clearTimeout(timeout)
  }, [showHint])

  useEffect(() => {
    if (hasNudged || hasInteracted) return

    const duration = 1400
    const amplitude = 0.03
    const start = performance.now()
    let frameId: number

    const animate = (now: number) => {
      const elapsed = now - start
      if (elapsed >= duration) {
        setSliderPosition(0.5)
        setHasNudged(true)
        return
      }

      const t = elapsed / duration
      const angle = t * Math.PI * 2
      const offset = Math.sin(angle) * amplitude
      setSliderPosition(0.5 + offset)
      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [hasNudged, hasInteracted])

  const handleCategoryChange = (category: string) => {
    if (category === activeCategory) return
    setIsFading(true)
    setTimeout(() => {
      setActiveCategory(category)
      setIsFading(false)
      setSliderPosition(0.5)
    }, 150)
  }

  const sliderPercentage = sliderPosition * 100

  return (
    <div className="flex flex-col items-center gap-6 max-w-[900px] mx-auto w-full">
      <div
        ref={sliderRef}
        className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#191f33] shadow-lg select-none cursor-col-resize"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endMouseDrag}
        onMouseLeave={endMouseDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endTouchDrag}
      >
        <div
          className="relative w-full h-full aspect-[16/9]"
          style={{
            opacity: isFading ? 0 : 1,
            transition: "opacity 200ms ease-out",
          }}
        >
          <Image
            src={currentCategory.afterSrc}
            alt={`${currentCategory.label} after redesign generated with Renderspace`}
            fill
            sizes="(min-width: 1280px) 900px, (min-width: 768px) 80vw, 100vw"
            className="object-cover"
            priority={activeCategory === categoryOrder[0]}
            unoptimized
          />

          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              width: `${sliderPercentage}%`,
              transition: isDragging ? "none" : "width 120ms ease-out",
            }}
          >
            <Image
              src={currentCategory.beforeSrc}
              alt={`${currentCategory.label} before redesign`}
              fill
              sizes="(min-width: 1280px) 900px, (min-width: 768px) 80vw, 100vw"
              className="object-cover"
              priority={activeCategory === categoryOrder[0]}
              unoptimized
            />
          </div>

          <div
            className="absolute inset-y-0 flex items-center"
            style={{
              left: `${sliderPercentage}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="relative h-full flex items-center justify-center">
              <div className="w-px h-full bg-white/40" />

              <div className="absolute -translate-x-1/2">
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-white text-xs font-medium text-black shadow-lg border border-primary/60 ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase text-gray-700">
                    <span className="inline-block w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-gray-700" />
                    <span>Drag</span>
                    <span className="inline-block w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-gray-700" />
                  </div>
                </div>

                {showHint && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-3 px-3 py-1 rounded-full bg-black/70 text-[10px] text-white whitespace-nowrap pointer-events-none transition-opacity duration-300">
                    Drag to reveal
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-[#05060b]/80 p-1 border border-white/10">
        {categoryOrder.map((key) => {
          const category = categoryConfig[key]
          if (!category) return null
          const isActive = key === activeCategory

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryChange(key)}
              className={`px-4 py-1 rounded-full text-xs md:text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "bg-transparent text-muted-foreground hover:bg-white/10"
              }`}
            >
              {category.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

