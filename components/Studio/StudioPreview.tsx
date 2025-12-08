"use client"

import { Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { getImageSrc, getImageFallback } from "@/lib/images/getImageSrc"
import { logImageDebug } from "@/lib/debug/imageDebug"

interface StudioPreviewProps {
  currentRender: string | null
  latestRenders: string[]
  isRendering?: boolean
  isLoading?: boolean
  onThumbnailClick: (renderUrl: string) => void
}

function RenderStatus({ isRendering }: { isRendering: boolean }) {
  return (
    <div className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3",
      isRendering 
        ? "bg-primary/10 text-primary" 
        : "bg-green-500/10 text-green-500"
    )}>
      {isRendering ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
          Rendering...
        </>
      ) : (
        "Ready"
      )}
    </div>
  )
}

function RenderThumbnail({ 
  url, 
  onClick 
}: { 
  url: string; 
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-[120px] group"
    >
      <div className="aspect-[4/3] rounded-lg overflow-hidden transition-shadow hover:shadow-lg shadow-md">
        <img 
          src={getImageSrc(url)} 
          alt="Previous render" 
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getImageFallback(url);
          }}
        />
      </div>
    </button>
  );
}

export function StudioPreview({
  currentRender,
  latestRenders,
  isRendering,
  isLoading,
  onThumbnailClick,
}: StudioPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const rendering = isRendering ?? isLoading ?? false;

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug image rendering
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ StudioPreview Debug:', {
        currentRender,
        hasCurrentRender: !!currentRender,
        isRendering: rendering,
        latestRendersCount: latestRenders.length
      });
      
      // Debug current render URL
      if (currentRender) {
        logImageDebug(currentRender, 'Current Render');
      }
      
      // Debug latest renders
      latestRenders.forEach((url, index) => {
        logImageDebug(url, `Latest Render ${index + 1}`);
      });
    }
  }, [currentRender, rendering, latestRenders]);

  // Early return during SSR
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gray-900 shadow-lg">
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg bg-gray-800">
            <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
            <p className="text-sm text-gray-400">Loading preview...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Your Current Render</h3>
        </div>
        <div className="space-y-3">
          {rendering && <RenderStatus isRendering={true} />}
          {currentRender && !rendering && <RenderStatus isRendering={false} />}
          <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gray-900 shadow-lg">
            {currentRender ? (
              <img
                src={getImageSrc(currentRender)}
                alt="Current render"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  console.error('❌ Image failed to load:', currentRender);
                  const target = e.target as HTMLImageElement;
                  target.src = getImageFallback(currentRender);
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg bg-gray-800">
                <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-400">No renders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {latestRenders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Previous Renders</h3>
          <div className="grid grid-cols-2 gap-4">
            {latestRenders.map((url, index) => (
              <RenderThumbnail
                key={index}
                url={url}
                onClick={() => onThumbnailClick(url)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
