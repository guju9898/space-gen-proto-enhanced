"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GridOption {
  value: string
  label: string
  imageUrl?: string
  icon?: React.ElementType
  color?: string
}

interface GridPickerDialogProps {
  label?: string
  value: string
  options: GridOption[]
  placeholder?: string
  onChange: (value: string) => void
  className?: string
}

export function GridPickerDialog({
  label,
  value,
  options,
  placeholder = "Select an option",
  onChange,
  className,
}: GridPickerDialogProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="text-sm font-medium mb-2 block">{label}</label>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between h-10 px-3 py-2 text-sm",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selectedOption?.label || placeholder}
            </span>
            {selectedOption?.imageUrl && (
              <img
                src={selectedOption.imageUrl}
                alt={selectedOption.label}
                className="h-5 w-5 rounded object-cover ml-2"
              />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{label || "Select an option"}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {options.map((option) => {
              const Icon = option.icon
              const [isPressed, setIsPressed] = React.useState(false)
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setIsPressed(true)
                    onChange(option.value)
                    setTimeout(() => {
                      setOpen(false)
                      setIsPressed(false)
                    }, 100)
                  }}
                  onMouseDown={() => setIsPressed(true)}
                  onMouseUp={() => setIsPressed(false)}
                  onMouseLeave={() => setIsPressed(false)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all duration-150 ease-out cursor-pointer",
                    "hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    value === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-accent/50",
                    isPressed && "scale-[0.97]"
                  )}
                >
                  {option.imageUrl ? (
                    <img
                      src={option.imageUrl}
                      alt={option.label}
                      className="h-20 w-full object-cover rounded"
                    />
                  ) : Icon ? (
                    <Icon className="h-12 w-12 text-muted-foreground" />
                  ) : option.color ? (
                    <div
                      className="h-12 w-full rounded"
                      style={{ backgroundColor: option.color }}
                    />
                  ) : (
                    <div className="h-12 w-full rounded bg-muted" />
                  )}
                  <span className="text-sm font-medium text-center">
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

