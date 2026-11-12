"use client"

import * as React from "react"
import { Check, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { isCustomValue, resolveTypedValue } from "@/lib/studio/customValue"
import { useFieldPresentation } from "@/components/Studio/useFieldPresentation"
import { FieldHint } from "@/components/Studio/FieldHint"
import { trackStudioEvent } from "@/components/Studio/analytics"

interface ImageOption {
  value: string
  label: string
  imageUrl?: string
  icon?: React.ElementType
  color?: string
}

interface ImageOptionGridProps {
  label?: string
  value: string
  options: ImageOption[]
  placeholder?: string
  onChange: (value: string) => void
  className?: string
  /** Lets the user type a value that is not one of the cards. On by default. */
  allowCustom?: boolean
}

function OptionCard({
  option,
  selected,
  onPick,
}: {
  option: ImageOption
  selected: boolean
  onPick: (value: string) => void
}) {
  const Icon = option.icon
  return (
    <button
      type="button"
      onClick={() => onPick(option.value)}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-150 ease-out cursor-pointer active:scale-[0.97]",
        "hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent/50"
      )}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-0.5 text-primary-foreground">
          <Check className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
      {option.imageUrl ? (
        <img src={option.imageUrl} alt="" className="h-20 w-full object-cover rounded" />
      ) : Icon ? (
        <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      ) : option.color ? (
        <div className="h-12 w-full rounded" style={{ backgroundColor: option.color }} />
      ) : (
        <div className="h-12 w-full rounded bg-muted" />
      )}
      <span className="text-sm font-medium text-center leading-tight">{option.label}</span>
    </button>
  )
}

/**
 * Card picker in a dialog (styles, room types, environments). Every picker also
 * takes a typed value, which is saved and sent to the render exactly as typed.
 */
export function ImageOptionGrid({
  label,
  value,
  options,
  placeholder = "Select an option",
  onChange,
  className,
  allowCustom = true,
}: ImageOptionGridProps) {
  const pres = useFieldPresentation(label)
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const inputId = React.useId()
  const optionValues = React.useMemo(() => options.map((o) => o.value), [options])
  const selectedOption = options.find((opt) => opt.value.toLowerCase() === value?.toLowerCase())
  const custom = isCustomValue(value, optionValues)

  const pick = (next: string) => {
    onChange(next)
    setDraft("")
    setOpen(false)
  }

  const useDraft = () => {
    const next = resolveTypedValue(draft, optionValues)
    if (next && isCustomValue(next, optionValues)) trackStudioEvent("custom_value_entered", { field: pres.meta?.key ?? label })
    if (next) pick(next)
  }

  if (pres.hidden) return null

  return (
    <div className={cn("w-full", className)}>
      {pres.label && <label className="text-sm font-medium mb-2 block">{pres.label}</label>}
      <FieldHint>{pres.hint}</FieldHint>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) setDraft(custom ? value : "")
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-between h-10 px-3 py-2 text-sm font-normal", !value && "text-muted-foreground")}
          >
            <span className="truncate" title={value || undefined}>
              {selectedOption?.label || value || placeholder}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              {custom && (
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  <PenLine className="h-3 w-3" aria-hidden="true" />
                  Custom
                </span>
              )}
              {selectedOption?.imageUrl && (
                <img src={selectedOption.imageUrl} alt="" className="h-5 w-5 rounded object-cover" />
              )}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold pr-8 mb-1">{pres.label || "Select an option"}</h3>
          <DialogDescription className="sr-only">Pick a card or type your own value.</DialogDescription>

          {allowCustom && (
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                useDraft()
              }}
            >
              <label htmlFor={inputId} className="sr-only">
                Type your own {label ?? "value"}
              </label>
              <input
                id={inputId}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Type your own${pres.label ? ` ${pres.label.toLowerCase()}` : ""}${pres.hint ? "" : ", e.g. something not shown below"}`}
                maxLength={200}
                className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" disabled={!draft.trim()} className="h-10">
                Use
              </Button>
            </form>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {options.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                selected={selectedOption?.value === option.value}
                onPick={pick}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
