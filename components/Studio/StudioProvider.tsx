"use client"

import { ReactNode } from "react"

interface StudioProviderProps {
  children: ReactNode
}

export function StudioProvider({ children }: StudioProviderProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  )
} 