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
    <div className="flex flex-wrap gap-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      {displayTags.map((tag, index) => (
        <Badge 
          key={`${tag}-${index}`} 
          variant="secondary"
          onClick={onRemove ? () => onRemove(tag) : undefined}
          className={onRemove ? "cursor-pointer" : undefined}
        >
          {tag}
        </Badge>
      ))}
      {onClearAll && displayTags.length > 0 && (
        <Badge 
          variant="outline" 
          onClick={onClearAll}
          className="cursor-pointer hover:bg-destructive/10"
        >
          Clear All
        </Badge>
      )}
    </div>
  );
}
