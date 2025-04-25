"use client"

import { ReactNode } from "react"

interface FormPanelProps {
  children: ReactNode
  title?: string
}

export function FormPanel({ children, title }: FormPanelProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {title && (
        <h3 className="text-lg font-medium mb-4">{title}</h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
