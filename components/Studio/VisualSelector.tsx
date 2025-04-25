import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface VisualSelectorProps {
  options: {
    value: string
    label: string
    icon?: LucideIcon
    thumbnail?: string
    color?: string
    emoji?: string
  }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function VisualSelector({ options, value, onChange, className }: VisualSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-4", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
            "hover:shadow-sm active:shadow-none",
            value === option.value
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card"
          )}
          onClick={() => onChange(option.value)}
        >
          {option.icon && (
            <option.icon className="h-8 w-8 text-muted-foreground" />
          )}
          {option.thumbnail && (
            <img
              src={option.thumbnail}
              alt={option.label}
              className="h-8 w-8 object-cover rounded-lg"
            />
          )}
          {option.color && (
            <div
              className="h-8 w-8 rounded-lg"
              style={{ backgroundColor: option.color }}
            />
          )}
          {option.emoji && (
            <span className="text-2xl">{option.emoji}</span>
          )}
          <span className="text-sm font-medium text-center">{option.label}</span>
        </button>
      ))}
    </div>
  )
} 