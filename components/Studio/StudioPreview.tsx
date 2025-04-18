"use client"

import { Loader2 } from "lucide-react"
import Image from "next/image"

export interface StudioPreviewProps {
  currentImage: string | null
  renderImage: string | null
  isRendering: boolean
  onRender: () => void
  error: string | null
}

export default function StudioPreview({
  currentImage,
  renderImage,
  isRendering,
  onRender,
  error,
}: StudioPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Preview</h3>
        <button
          onClick={onRender}
          disabled={!currentImage || isRendering}
          className={`px-4 py-2 rounded-md font-medium ${
            !currentImage || isRendering
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[#FF6B00] to-[#9747ff] text-white hover:opacity-90"
          }`}
        >
          {isRendering ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            "Generate Design"
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900/50">
        {renderImage ? (
          <Image
            src={renderImage}
            alt="Generated design"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            {currentImage ? "Click Generate to see the result" : "Upload an image to get started"}
          </div>
        )}
      </div>
    </div>
  )
}
