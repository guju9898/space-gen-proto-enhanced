"use client"

import { useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react"

export interface ImageLightboxProps {
  open: boolean
  onClose: () => void
  /** Image URLs in order */
  images: { url: string; alt?: string }[]
  /** Current index (0-based) */
  currentIndex: number
  onPrevious: () => void
  onNext: () => void
  onDownload?: (index: number) => void
}

export function ImageLightbox({
  open,
  onClose,
  images,
  currentIndex,
  onPrevious,
  onNext,
  onDownload,
}: ImageLightboxProps) {
  const canGoPrev = images.length > 1
  const canGoNext = images.length > 1
  const current = images[currentIndex]

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrevious()
      if (e.key === "ArrowRight") onNext()
    },
    [open, onClose, onPrevious, onNext]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {current && (
        <div
          className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative max-w-6xl max-h-[85vh] w-full h-full">
            <Image
              src={current.url}
              alt={current.alt ?? "Concept"}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized={current.url.startsWith("data:")}
            />
          </div>

          {canGoPrev && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPrevious() }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          {canGoNext && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDownload(currentIndex) }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
        </div>
      )}

      {images.length > 1 && (
        <p className="absolute bottom-4 right-4 text-xs text-white/50">
          {currentIndex + 1} / {images.length}
        </p>
      )}
    </div>
  )
}
