"use client"

import { useEffect, useRef } from "react"
import SafeImage from "@/components/SafeImage"
import { X } from "lucide-react"

interface DesignStyle {
  id: string
  name: string
  imageUrl: string
}

interface DesignStyleModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectStyle: (styleId: string) => void
  selectedStyle: string | null
}

export default function DesignStyleModal({ isOpen, onClose, onSelectStyle, selectedStyle }: DesignStyleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Mock design styles data
  const designStyles: DesignStyle[] = [
    { id: "modern", name: "Modern", imageUrl: "/studio/modern-thumbnail.jpg" },
    { id: "contemporary", name: "Contemporary", imageUrl: "/studio/contemporary-thumbnail.jpg" },
    { id: "traditional", name: "Traditional", imageUrl: "/studio/traditional-thumbnail.jpg" },
    { id: "minimalism", name: "Minimalism", imageUrl: "/studio/minimalist-thumbnail.jpg" },
    { id: "industrial", name: "Industrial", imageUrl: "/studio/industrial-thumbnail.jpg" },
    { id: "scandinavian", name: "Scandinavian", imageUrl: "/studio/scandinavian-thumbnail.jpg" },
    { id: "mediterranean", name: "Mediterranean", imageUrl: "/studio/mediterranean-thumbnail.jpg" },
    { id: "rustic", name: "Rustic", imageUrl: "/studio/rustic-thumbnail.jpg" },
    { id: "vintage", name: "Vintage", imageUrl: "/studio/vintage-thumbnail.jpg" },
    { id: "eclectic", name: "Eclectic", imageUrl: "/studio/eclectic-thumbnail.jpg" },
  ]

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.addEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "hidden" // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "" // Restore scrolling when modal is closed
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className="bg-black border border-zinc-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto animate-fade-in"
      >
        <div className="p-4 flex justify-between items-center border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-medium text-white">Design style</h2>
            <p className="text-sm text-zinc-400">Select design style that you want to apply to your interior</p>
          </div>
          <button onClick={() => onClose()} className="text-zinc-400 hover:text-white transition-colors p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {designStyles.map((style) => {
              const validImageUrl = style.imageUrl && style.imageUrl.trim() !== ""

              return (
                <div
                  key={style.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-105 group ${
                    selectedStyle === style.id ? "ring-2 ring-purple-500" : ""
                  }`}
                  onClick={() => {
                    onSelectStyle(style.id)
                    onClose()
                  }}
                >
                  <div className="relative aspect-square">
                    {validImageUrl && (
                      <SafeImage
                        src={style.imageUrl}
                        alt={style.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 group-hover:opacity-90" />

                  {selectedStyle === style.id && (
                    <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 text-white font-medium text-sm">{style.name}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
