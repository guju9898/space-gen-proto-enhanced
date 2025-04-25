"use client"

import { Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

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
      <div className="aspect-[4/3] rounded-md overflow-hidden transition-shadow hover:shadow-lg">
        <img 
          src={url} 
          alt="Previous render" 
          className="w-full h-full object-cover"
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
    }
  }, [currentRender, rendering, latestRenders]);

  // Early return during SSR
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted">
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md">
            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Current Render</h3>
        </div>
        <div className="space-y-3">
          {rendering && <RenderStatus isRendering={true} />}
          {currentRender && !rendering && <RenderStatus isRendering={false} />}
          <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted">
            {currentRender ? (
              <img
                src={currentRender}
                alt="Current render"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ Image failed to load:', currentRender);
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.png';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md">
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No render yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {latestRenders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previous Renders</h3>
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
