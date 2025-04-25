"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Option {
  label: string
  value: string
  icon?: React.ElementType
}

interface DropdownSelectorProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ElementType
}

export function DropdownSelector({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  icon: Icon,
}: DropdownSelectorProps) {
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <SelectValue placeholder={placeholder}>
            {selectedOption?.label}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon && <option.icon className="h-4 w-4" />}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
