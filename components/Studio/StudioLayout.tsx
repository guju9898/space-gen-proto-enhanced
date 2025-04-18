"use client"

import { ReactNode } from 'react'
import Link from 'next/link'
import { useDesignConfig } from '@/hooks/useDesignConfig'
import { ChevronLeft } from "lucide-react"
import SpaceGenLogo from "@/components/SpaceGenLogo"
import StudioModeToggle from "./StudioModeToggle"

interface StudioLayoutProps {
  children: React.ReactNode
  formContent: React.ReactNode
  previewContent: React.ReactNode
  requestContent: React.ReactNode
}

export default function StudioLayout({
  children,
  formContent,
  previewContent,
  requestContent,
}: StudioLayoutProps) {
  const { config, setActiveStudio } = useDesignConfig()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="py-4 border-b border-border">
        <div className="w-full sm:w-[90%] lg:w-[80%] xl:w-[70%] px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <SpaceGenLogo />
            </div>
            <StudioModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="w-full sm:w-[90%] lg:w-[80%] xl:w-[70%] px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Configuration UI */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-xl shadow-md p-6">
                {formContent}
              </div>
            </div>

            {/* Center Column - Preview */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-md p-6">
                {previewContent}
              </div>
            </div>

            {/* Right Column - Request Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-md p-6">
                {requestContent}
              </div>
            </div>
          </div>
        </div>
      </main>

      {children}
    </div>
  )
}
