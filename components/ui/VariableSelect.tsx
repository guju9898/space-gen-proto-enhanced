"use client"

import * as React from "react"
import { Check, ChevronDown, PenLine, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { isCustomValue, resolveTypedValue } from "@/lib/studio/customValue"
import { joinMulti, splitMulti } from "@/lib/studio/fields"
import { useIsMobile } from "@/hooks/use-mobile"
import { useFieldPresentation } from "@/components/Studio/useFieldPresentation"
import { FieldHint } from "@/components/Studio/FieldHint"
import { SegmentedToggle } from "@/components/Studio/SegmentedToggle"
import { trackStudioEvent } from "@/components/Studio/analytics"

interface VariableSelectProps {
  label?: string
  value: string
  options: string[]
  placeholder?: string
  allowCustom?: boolean
  onChange: (value: string) => void
}

/**
 * Studio field: pick a listed option or type your own. Typed text is kept exactly
 * (a partial match never replaces it), is offered as the first row, and is saved
 * when the list closes, so nothing typed is lost.
 *
 * Studio v2 (flagged): contractor labels and hints, several values for fields like
 * plants and materials (stored "a, b"), named levels instead of 0-100, a bottom
 * sheet on phones, and camera fields tucked away in photo mode.
 */
export function VariableSelect({
  label,
  value,
  options,
  placeholder = "Pick one or type your own",
  allowCustom = true,
  onChange,
}: VariableSelectProps) {
  const pres = useFieldPresentation(label, placeholder)
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const id = React.useId()

  const multi = pres.v2 && Boolean(pres.meta?.multi)
  const picked = multi ? splitMulti(value) : []
  const typed = searchValue.trim()
  const resolved = allowCustom ? resolveTypedValue(searchValue, options) : ""
  const alreadyPicked = multi && picked.some((p) => p.toLowerCase() === resolved.toLowerCase())
  const offerTyped = allowCustom && typed !== "" && isCustomValue(resolved, options) && !alreadyPicked
  const custom = !multi && isCustomValue(value, options)

  const filteredOptions = React.useMemo(() => {
    if (!typed) return options
    return options.filter((option) => option.toLowerCase().includes(typed.toLowerCase()))
  }, [options, typed])

  if (pres.hidden) return null

  if (pres.meta?.levels) {
    return (
      <SegmentedToggle
        label={pres.label}
        hint={pres.hint}
        value={value}
        options={pres.meta.levels}
        onChange={onChange}
      />
    )
  }

  const track = (next: string) => {
    if (isCustomValue(next, options)) trackStudioEvent("custom_value_entered", { field: pres.meta?.key ?? label ?? placeholder })
  }

  const setOpenState = (next: boolean) => {
    if (!next && allowCustom && typed) {
      // Closing with text still in the box (click away, swipe down) saves it.
      choose(resolved, true, true)
      return
    }
    if (!next) setSearchValue("")
    setOpen(next)
  }

  /** fromTyping: typed text only ever adds; clicking a picked option toggles it off. */
  function choose(next: string, closing = false, fromTyping = false) {
    if (!next) return
    track(next)
    if (multi) {
      const exists = picked.some((p) => p.toLowerCase() === next.toLowerCase())
      if (exists && fromTyping) {
        setSearchValue("")
        if (closing) setOpen(false)
        return
      }
      onChange(joinMulti(exists ? picked.filter((p) => p.toLowerCase() !== next.toLowerCase()) : [...picked, next]))
      setSearchValue("")
      if (closing) setOpen(false)
      return
    }
    onChange(next)
    setSearchValue("")
    setOpen(false)
  }

  const removePicked = (item: string) => {
    onChange(joinMulti(picked.filter((p) => p !== item)))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && allowCustom && typed) {
      e.preventDefault()
      e.stopPropagation()
      choose(resolved, false, true)
    } else if (e.key === "Escape") {
      setSearchValue("")
      setOpen(false)
    }
  }

  const isSelected = (option: string) =>
    multi ? picked.some((p) => p.toLowerCase() === option.toLowerCase()) : option.toLowerCase() === value?.toLowerCase()

  const list = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={allowCustom ? (multi ? "Search or type, then Enter to add…" : "Search or type your own…") : "Search…"}
        value={searchValue}
        onValueChange={setSearchValue}
        onKeyDown={handleKeyDown}
        className={cn(isMobile && "text-base")}
      />
      <CommandList className={cn(isMobile && pres.v2 && "max-h-[50vh]")}>
        {offerTyped && (
          <CommandGroup heading="Your text">
            <CommandItem value={`__custom__${typed}`} onSelect={() => choose(resolved, false, true)}>
              <PenLine className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
              <span className="truncate">
                {multi ? "Add" : "Use"} “{typed}”
              </span>
            </CommandItem>
          </CommandGroup>
        )}
        {filteredOptions.length > 0 ? (
          <CommandGroup heading={offerTyped ? "Options" : undefined}>
            {filteredOptions.map((option) => (
              <CommandItem key={option} value={option} onSelect={() => choose(option)}>
                <Check className={cn("mr-2 h-4 w-4", isSelected(option) ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          !offerTyped && <div className="py-3 text-center text-sm text-muted-foreground">No options found</div>
        )}
      </CommandList>
      {allowCustom && !typed && (
        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {multi
            ? "Pick several, or type exactly what you want and press Enter."
            : "Not listed? Type exactly what you want, e.g. a material, plant or brand finish."}
        </p>
      )}
      {multi && (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={() => setOpenState(false)}
            className="h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground"
          >
            Done
          </button>
        </div>
      )}
    </Command>
  )

  const triggerContent = (
    <>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-left">
        {multi && picked.length > 0 ? (
          picked.map((item) => (
            <span
              key={item}
              className="inline-flex max-w-full items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
            >
              <span className="truncate">{item}</span>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove ${item}`}
                onClick={(e) => {
                  e.stopPropagation()
                  removePicked(item)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    removePicked(item)
                  }
                }}
                className="rounded hover:bg-background/60"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </span>
            </span>
          ))
        ) : (
          <span className={cn("truncate", !value && "text-muted-foreground")} title={value || undefined}>
            {(!multi && value) || placeholder}
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        {custom && (
          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
            <PenLine className="h-3 w-3" aria-hidden="true" />
            Custom
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-150", open && "rotate-180")} aria-hidden="true" />
      </span>
    </>
  )

  const triggerClass = cn(
    "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
    multi && picked.length > 0 ? "min-h-10" : "h-10",
    pres.v2 && "min-h-11",
    "transition-colors duration-150 hover:border-ring/50",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  )

  const labelEl = pres.label && (
    <label htmlFor={id} className="text-sm font-medium mb-1 block">
      {pres.label}
    </label>
  )

  // Phones in v2: bottom sheet with large rows instead of a small popover.
  if (pres.v2 && isMobile) {
    return (
      <div className="w-full">
        {labelEl}
        <FieldHint>{pres.hint}</FieldHint>
        <button id={id} type="button" aria-haspopup="dialog" aria-expanded={open} className={triggerClass} onClick={() => setOpen(true)}>
          {triggerContent}
        </button>
        <Sheet open={open} onOpenChange={setOpenState}>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-xl px-2 pb-4 pt-4 [&_[cmdk-item]]:py-3">
            <SheetTitle className="px-2 text-base font-semibold">{pres.label ?? "Choose"}</SheetTitle>
            <SheetDescription className={cn("px-2 text-xs", !pres.hint && "sr-only")}>
              {pres.hint ?? "Pick an option or type your own."}
            </SheetDescription>
            <div className="mt-2">{list}</div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="w-full">
      {labelEl}
      <FieldHint>{pres.hint}</FieldHint>
      <Popover open={open} onOpenChange={setOpenState}>
        <PopoverTrigger asChild>
          <button id={id} type="button" aria-haspopup="listbox" aria-expanded={open} className={triggerClass}>
            {triggerContent}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0" align="start">
          {list}
        </PopoverContent>
      </Popover>
    </div>
  )
}
