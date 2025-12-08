"use client"

import { ReactNode } from "react"

interface FormPanelProps {
  children: ReactNode
  title?: string
}

export function FormPanel({ children, title }: FormPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 min-h-screen md:min-h-0 h-full">
      {title && (
        <h3 className="text-lg font-medium mb-4 text-white">{title}</h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
