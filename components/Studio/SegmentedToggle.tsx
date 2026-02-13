"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleOption {
  value: string
  label: string
  icon?: React.ElementType
}

interface SegmentedToggleProps {
  label?: string
  value: string
  options: ToggleOption[]
  onChange: (value: string) => void
  className?: string
}

export function SegmentedToggle({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedToggleProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="text-sm font-medium mb-2 block">{label}</label>
      )}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}



