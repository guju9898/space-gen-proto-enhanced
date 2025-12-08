"use client"

import { useState, useEffect } from "react"
import SafeImage from "@/components/SafeImage"
import { Info, Loader2, ChevronRight } from "lucide-react"
import { getImageSrc, getImageFallback } from "@/lib/images/getImageSrc"

interface RenderPreviewProps {
  renderImage: string | null
  isLoading?: boolean
  error?: string | null
  onOpenInfo?: () => void
  emptyStateText?: string
}

export default function RenderPreview({
  renderImage,
  isLoading = false,
  error = null,
  onOpenInfo,
  emptyStateText = "You don't have any generated image yet",
}: RenderPreviewProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Reset image loaded state when render image changes
  useEffect(() => {
    setIsImageLoaded(false)
  }, [renderImage])

  // Ensure renderImage is not an empty string
  const imageSource = renderImage && renderImage.trim() !== "" ? renderImage : null

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Latest renders</h2>
        <div className="flex items-center text-zinc-400 hover:text-white">
          <span className="text-sm">View all</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>

      <div className="flex-1 w-full bg-zinc-900/50 rounded-lg flex items-center justify-center overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-zinc-400">Generating your design...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M3.6 3.6A9 9 0 1 0 20.4 20.4 9 9 0 0 0 3.6 3.6" />
              </svg>
            </div>
            <p className="text-sm text-red-400 mb-2">Error generating design</p>
            <p className="text-xs text-zinc-500">{error}</p>
          </div>
        ) : imageSource ? (
          <div className="relative w-full h-full">
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            )}
            {/* Only render the Image component when imageSource is a valid string */}
            <SafeImage
              src={getImageSrc(imageSource)}
              alt="Generated design"
              fill
              className={`object-contain transition-opacity duration-300 ${
                isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => {
                // Fallback handled by SafeImage component
                setIsImageLoaded(true);
              }}
              sizes="(max-width: 1200px) 100vw, 800px"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <Info className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-400">{emptyStateText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
