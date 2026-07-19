"use client"

/**
 * Human Polish™ intake — small labeled field primitives built on components/ui.
 * Keeps the wizard steps declarative and consistent with the marketing styling.
 */

import type { ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}

interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export function FieldShell({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-white">
        {label}
        {required ? <span className="ml-0.5 text-orange-400">*</span> : null}
      </Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
      <FieldError message={error} />
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
  error?: string
  autoComplete?: string
  inputMode?: "text" | "email" | "tel" | "url" | "numeric"
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  hint,
  error,
  autoComplete,
  inputMode,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-[#10141f] border-[#343434] text-white",
          error ? "border-red-500/60" : "",
        )}
        aria-invalid={Boolean(error)}
      />
    </FieldShell>
  )
}

interface TextAreaFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
  error?: string
  rows?: number
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
  error,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-[#10141f] border-[#343434] text-white",
          error ? "border-red-500/60" : "",
        )}
        aria-invalid={Boolean(error)}
      />
    </FieldShell>
  )
}

interface CheckboxRowProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  error?: string
}

export function CheckboxRow({ id, checked, onChange, children, error }: CheckboxRowProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
          checked ? "border-orange-500/40 bg-orange-500/5" : "border-[#343434] hover:bg-white/5",
          error ? "border-red-500/50" : "",
        )}
      >
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(v) => onChange(v === true)}
          className="mt-0.5"
        />
        <span className="text-sm text-muted-foreground [&_strong]:text-white">{children}</span>
      </label>
      <FieldError message={error} />
    </div>
  )
}

interface OptionCardsProps<T extends string> {
  value: T | ""
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  columns?: 2 | 3
}

export function OptionCards<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: OptionCardsProps<T>) {
  return (
    <div className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left",
              active
                ? "border-orange-500/60 bg-gradient-to-r from-orange-500/15 to-violet-700/15 text-white"
                : "border-[#343434] text-muted-foreground hover:bg-white/5",
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
