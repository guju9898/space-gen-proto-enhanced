"use client"

import * as React from "react"
import { Check, ChevronDown, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { isCustomValue, resolveTypedValue } from "@/lib/studio/customValue"

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
 */
export function VariableSelect({
  label,
  value,
  options,
  placeholder = "Pick one or type your own",
  allowCustom = true,
  onChange,
}: VariableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const id = React.useId()

  const typed = searchValue.trim()
  const resolved = allowCustom ? resolveTypedValue(searchValue, options) : ""
  const offerTyped = allowCustom && typed !== "" && isCustomValue(resolved, options)
  const custom = isCustomValue(value, options)

  const filteredOptions = React.useMemo(() => {
    if (!typed) return options
    return options.filter((option) => option.toLowerCase().includes(typed.toLowerCase()))
  }, [options, typed])

  const commit = (next: string) => {
    if (next) onChange(next)
    setSearchValue("")
    setOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    // Closing with text still in the box (click away, tap outside) saves it.
    if (!next && allowCustom && typed) {
      commit(resolved)
      return
    }
    if (!next) setSearchValue("")
    setOpen(next)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && allowCustom && typed) {
      e.preventDefault()
      e.stopPropagation()
      commit(resolved)
    } else if (e.key === "Escape") {
      setSearchValue("")
      setOpen(false)
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium mb-1 block">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
              "transition-colors duration-150 hover:border-ring/50",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate text-left" title={value || undefined}>
              {value || placeholder}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              {custom && (
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  <PenLine className="h-3 w-3" aria-hidden="true" />
                  Custom
                </span>
              )}
              <ChevronDown
                className={cn("h-4 w-4 opacity-50 transition-transform duration-150", open && "rotate-180")}
                aria-hidden="true"
              />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={allowCustom ? "Search or type your own…" : "Search…"}
              value={searchValue}
              onValueChange={setSearchValue}
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              {offerTyped && (
                <CommandGroup heading="Your text">
                  <CommandItem value={`__custom__${typed}`} onSelect={() => commit(resolved)}>
                    <PenLine className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="truncate">Use “{typed}”</span>
                  </CommandItem>
                </CommandGroup>
              )}
              {filteredOptions.length > 0 ? (
                <CommandGroup heading={offerTyped ? "Options" : undefined}>
                  {filteredOptions.map((option) => (
                    <CommandItem key={option} value={option} onSelect={() => commit(option)}>
                      <Check
                        className={cn("mr-2 h-4 w-4", option.toLowerCase() === value?.toLowerCase() ? "opacity-100" : "opacity-0")}
                        aria-hidden="true"
                      />
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
                Not listed? Type exactly what you want, e.g. a material, plant or brand finish.
              </p>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
