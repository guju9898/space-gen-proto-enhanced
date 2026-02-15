"use client"

import { X } from "lucide-react"
import { useEffect, useRef } from "react"
import SafeImage from "@/components/SafeImage"

interface TipItem {
  title: string
  description: string
}

interface TipsModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  tips?: TipItem[]
}

export default function TipsModal({
  isOpen,
  onClose,
  title = "Your current image",
  tips = [
    {
      title: "Capture a photo of your room",
      description:
        "For the best results, capture the room from a 90° angle facing a wall or straight horizontally. Avoid wide-angle photos, since the AI generates more realistic results with standard-angle photos.",
    },
    {
      title: "Clear the space",
      description: "Remove clutter and personal items for better results.",
    },
    {
      title: "Good lighting",
      description: "Ensure the room is well-lit with natural light if possible.",
    },
  ],
}: TipsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

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
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-zinc-900 rounded-lg shadow-lg max-w-md w-full overflow-hidden animate-fade-in">
        <div className="p-4 bg-black flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">{title}</h2>
          <button onClick={() => onClose()} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">{tip.title}</h3>
                  <p className="text-sm text-zinc-300">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-black/30 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Example of a good photo</h3>
            <div className="relative h-48 w-full">
              <SafeImage
                src="/studio/example-room-photo.jpg"
                alt="Example of a good room photo"
                fill
                className="object-cover rounded"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
