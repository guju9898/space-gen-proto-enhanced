import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
} 