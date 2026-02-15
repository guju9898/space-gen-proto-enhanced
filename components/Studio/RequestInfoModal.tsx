"use client"

import { X } from "lucide-react"
import { useEffect, useRef } from "react"

interface RequestInfoModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  content?: string
}

export default function RequestInfoModal({
  isOpen,
  onClose,
  title = "Request info",
  content = "Here, you will find all your selected settings displayed as they are being processed. You can choose settings, remove specific ones, or clear them all to start the selection process from scratch.",
}: RequestInfoModalProps) {
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
          <p className="text-zinc-300 text-sm">{content}</p>
        </div>
      </div>
    </div>
  )
}
