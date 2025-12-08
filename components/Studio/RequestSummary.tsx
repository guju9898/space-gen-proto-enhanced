"use client"

import { ElementType, useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { InteriorConfig } from "@/types/studio"

interface RequestSummaryProps {
  tags?: string[];
  config?: InteriorConfig;
  icon?: ElementType;
  onRemove?: (key: string) => void;
  onClearAll?: () => void;
}

export function RequestSummary({ tags, config, icon: Icon, onRemove, onClearAll }: RequestSummaryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Early return during SSR
  if (!mounted) {
    return <div className="h-[40px]" />;
  }

  const displayTags = tags || Object.entries(config || {})
    .filter(([key, value]) => 
      key !== 'image' && 
      key !== 'realism' && 
      value !== null && 
      value !== undefined
    )
    .map(([key, value]) => value as string);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 min-h-screen md:min-h-0 h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4 text-white">Request Summary</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {displayTags.length > 0 ? (
            displayTags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                onClick={onRemove ? () => onRemove(tag) : undefined}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium
                  bg-gray-700 text-white
                  hover:bg-gray-600 transition-colors
                  ${onRemove ? "cursor-pointer" : ""}
                `}
              >
                {tag}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-400">No tags selected</p>
          )}
        </div>
        {onClearAll && displayTags.length > 0 && (
          <button
            onClick={onClearAll}
            className="mt-auto px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
