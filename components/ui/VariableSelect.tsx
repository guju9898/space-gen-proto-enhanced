"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface VariableSelectProps {
  label?: string
  value: string
  options: string[]
  placeholder?: string
  allowCustom?: boolean
  onChange: (value: string) => void
}

export function VariableSelect({
  label,
  value,
  options,
  placeholder = "Select or type...",
  allowCustom = true,
  onChange,
}: VariableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) return options
    return options.filter((option) =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  // Auto-open on first keystroke
  React.useEffect(() => {
    if (searchValue && !open) {
      setOpen(true)
    }
  }, [searchValue, open])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setSearchValue("")
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // If there's a filtered option, select the first one
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0])
      } else if (allowCustom && searchValue.trim()) {
        // Commit custom value
        onChange(searchValue.trim())
        setSearchValue("")
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      setSearchValue("")
      setOpen(false)
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium mb-1 block">{label}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground",
              "transition-all duration-150 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "focus:border-ring/60 focus:bg-background/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              !value && "text-muted-foreground"
            )}
          >
            <span className={cn(
              "truncate transition-opacity duration-150",
              open && !value && "opacity-60"
            )}>
              {value || placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-150" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type to search or enter custom value..."
              value={searchValue}
              onValueChange={setSearchValue}
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              <CommandEmpty>
                {allowCustom ? (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    Press Enter to use &quot;{searchValue}&quot;
                  </div>
                ) : (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    No options found
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                  >
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

