"use client"

import { ElementType, useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { InteriorConfig, ExteriorConfig, LandscapeConfig } from "@/types/studio"
import { cn } from "@/lib/utils"

interface RequestSummaryProps {
  tags?: string[];
  config?: InteriorConfig | ExteriorConfig | LandscapeConfig;
  icon?: ElementType;
  onRemove?: (key: string) => void;
  onClearAll?: () => void;
}

export function RequestSummary({ tags, config, icon: Icon, onRemove, onClearAll }: RequestSummaryProps) {
  const [mounted, setMounted] = useState(false);
  const [removingTags, setRemovingTags] = useState<Set<string>>(new Set());

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
      key !== 'advanced' &&
      value !== null && 
      value !== undefined &&
      (typeof value === 'string' || typeof value === 'number') &&
      String(value).trim() !== ''
    )
    .map(([key, value]) => String(value));

  const handleRemove = (tag: string) => {
    if (onRemove) {
      setRemovingTags(prev => new Set(prev).add(tag))
      setTimeout(() => {
        onRemove(tag)
        setRemovingTags(prev => {
          const next = new Set(prev)
          next.delete(tag)
          return next
        })
      }, 150)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      {displayTags.map((tag, index) => {
        const isRemoving = removingTags.has(tag)
        return (
          <Badge 
            key={`${tag}-${index}`} 
            variant="secondary"
            onClick={onRemove ? () => handleRemove(tag) : undefined}
            className={cn(
              "transition-all duration-150 ease-out",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-left-1",
              "hover:bg-secondary/80",
              onRemove && "cursor-pointer",
              isRemoving && "opacity-0 scale-95"
            )}
            style={{
              animationDelay: `${index * 20}ms`,
            }}
            title={tag}
          >
            {tag}
          </Badge>
        )
      })}
      {onClearAll && displayTags.length > 0 && (
        <Badge 
          variant="outline" 
          onClick={onClearAll}
          className={cn(
            "cursor-pointer transition-all duration-150 ease-out",
            "hover:bg-destructive/10 hover:border-destructive/20"
          )}
        >
          Clear All
        </Badge>
      )}
    </div>
  );
}
