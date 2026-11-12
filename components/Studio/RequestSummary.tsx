"use client"

import { ElementType, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InteriorConfig, ExteriorConfig, LandscapeConfig } from "@/types/studio"
import { cn } from "@/lib/utils"
import { labelForKey } from "@/lib/studio/fields"
import { studioKindFromPath } from "@/lib/studio/lastStudio"
import { isSupersededKey } from "@/lib/studio/summary"

interface RequestSummaryProps {
  tags?: string[]
  config?: InteriorConfig | ExteriorConfig | LandscapeConfig
  icon?: ElementType
  /** Called with the config key of the chip (resets or clears that field). */
  onRemove?: (key: string) => void
  onClearAll?: () => void
}

const HIDDEN_KEYS = new Set(["image", "realism", "advanced", "renderType"])

/**
 * What this render will ask for, as "Field: value" chips. Removing a chip resets
 * that field in the form (it used to pass the value instead of the field, so most
 * removals did nothing).
 */
export function RequestSummary({ tags, config, icon: Icon, onRemove, onClearAll }: RequestSummaryProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const studio = studioKindFromPath(pathname)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-[40px]" />

  const entries: { key: string; label: string; value: string }[] = tags
    ? tags.map((tag) => ({ key: tag, label: "", value: tag }))
    : Object.entries(config || {})
        .filter(
          ([key, value]) =>
            !HIDDEN_KEYS.has(key) &&
            !isSupersededKey(key, (config || {}) as Record<string, unknown>) &&
            (typeof value === "string" || typeof value === "number") &&
            String(value).trim() !== "" &&
            String(value).trim().toLowerCase() !== "none"
        )
        .map(([key, value]) => ({ key, label: labelForKey(studio, key), value: String(value) }))

  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">This render will ask for</h3>
      <div className="flex flex-wrap gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        {entries.map((entry) => (
          <Badge
            key={entry.key}
            variant="secondary"
            className={cn("max-w-full gap-1 py-1 pl-2.5 pr-1 font-normal", "animate-in fade-in-0 zoom-in-95")}
            title={`${entry.label ? `${entry.label}: ` : ""}${entry.value}`}
          >
            <span className="truncate max-w-[260px]">
              {entry.label && <span className="text-muted-foreground">{entry.label}: </span>}
              {entry.value}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(entry.key)}
                aria-label={`Remove ${entry.label || entry.value}`}
                className="rounded p-0.5 hover:bg-background/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </Badge>
        ))}
        {onClearAll && (
          <Badge
            variant="outline"
            onClick={() => onClearAll()}
            className="cursor-pointer transition-colors hover:bg-destructive/10 hover:border-destructive/20"
          >
            Clear all
          </Badge>
        )}
      </div>
    </div>
  )
}
