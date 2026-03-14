"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Download } from "lucide-react"
import { ImageLightbox } from "./ImageLightbox"
import type { SharedProjectRender } from "@/types/share-project"

export interface ConceptGalleryProps {
  renders: SharedProjectRender[]
  /** Optional: trigger download for a render (e.g. open in new tab or blob download) */
  onDownload?: (render: SharedProjectRender) => void
}

function downloadImage(url: string, filename: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function ConceptGallery({ renders, onDownload }: ConceptGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const images = renders.map((r) => ({
    url: r.imageUrl,
    alt: r.promptSummary ?? undefined,
  }))

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  const handleDownload = useCallback(
    (index: number) => {
      const render = renders[index]
      if (onDownload) {
        onDownload(render)
      } else {
        const name = `concept-${render.id}.png`
        downloadImage(render.imageUrl, name)
      }
    },
    [renders, onDownload]
  )

  if (renders.length === 0) return null

  return (
    <>
      <section className="py-12 sm:py-16 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-6 sm:mb-8">
            Concept Gallery
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {renders.map((render, index) => (
              <div
                key={render.id}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={render.thumbnailUrl ?? render.imageUrl}
                  alt={render.promptSummary ?? "Concept"}
                  fill
                  className="object-cover transition-transform group-hover:scale-[1.02]"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(index)
                  }}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  aria-label="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        currentIndex={lightboxIndex}
        onPrevious={goPrev}
        onNext={goNext}
        onDownload={handleDownload}
      />
    </>
  )
}
