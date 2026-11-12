"use client"

import * as React from "react"
import { PenLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { isCustomValue, resolveTypedValue } from "@/lib/studio/customValue"

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
  /** Adds a "Custom" segment with a text box (e.g. "golden hour", "blue hour"). On by default. */
  allowCustom?: boolean
}

export function SegmentedToggle({ label, value, options, onChange, className, allowCustom = true }: SegmentedToggleProps) {
  const optionValues = React.useMemo(() => options.map((o) => o.value), [options])
  const custom = isCustomValue(value, optionValues)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(custom ? value : "")
  const inputId = React.useId()
  const showInput = allowCustom && (editing || custom)

  const save = () => {
    const next = resolveTypedValue(draft, optionValues)
    if (next) onChange(next)
    setEditing(false)
  }

  const segmentClass = (selected: boolean) =>
    cn(
      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all min-h-[40px]",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
    )

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="text-sm font-medium mb-2 block">{label}</label>}
      <div role="group" aria-label={label} className="flex gap-1 p-1 bg-muted rounded-lg">
        {options.map((option) => {
          const Icon = option.icon
          const selected = !custom && !editing && value === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setEditing(false)
                onChange(option.value)
              }}
              className={segmentClass(selected)}
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              <span>{option.label}</span>
            </button>
          )
        })}
        {allowCustom && (
          <button
            type="button"
            aria-pressed={showInput}
            onClick={() => {
              setDraft(custom ? value : "")
              setEditing(true)
            }}
            className={segmentClass(showInput)}
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            <span>Custom</span>
          </button>
        )}
      </div>
      {showInput && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Type your own {label ?? "value"}
          </label>
          <input
            id={inputId}
            autoFocus={editing}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft.trim() && save()}
            placeholder="e.g. golden hour, blue hour dusk"
            maxLength={200}
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Use
          </button>
        </form>
      )}
    </div>
  )
}
