"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StudioPageLayoutProps {
  formContent: ReactNode
  previewContent: ReactNode
  requestContent: ReactNode
}

export function StudioPageLayout({
  formContent,
  previewContent,
  requestContent,
}: StudioPageLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Configuration UI */}
      <div className="space-y-6">
        {formContent}
      </div>

      {/* Center Column - Preview */}
      <div className="space-y-6">
        {previewContent}
      </div>

      {/* Right Column - Request Summary */}
      <div className="space-y-6">
        {requestContent}
      </div>
    </div>
  )
}

// Shared tag component for request summary
export function Tag({ label, value, onRemove, required, icon: Icon }: {
  label: string
  value: string
  onRemove?: () => void
  required?: boolean
  icon?: LucideIcon
}) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm bg-muted",
      "hover:bg-muted/80 transition-colors",
      "group"
    )}>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="font-medium">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
      {!required && onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  )
}

// Shared section component for form groups
export function FormSection({ title, children }: {
  title: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
} 