"use client"

import type { ReactNode } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  isLastStep?: boolean
  isFirstStep?: boolean
  title?: string
  hideNext?: boolean
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isLastStep = false,
  isFirstStep = false,
  title,
  hideNext = false,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#ec4899] py-3 px-4">
        <div className="text-white font-bold text-lg">Ready For Dev</div>
      </header>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
        {/* Progress indicator */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] h-full rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Title */}
        {title && <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">{title}</h1>}

        {/* Main content */}
        <div className="w-full bg-[#111] rounded-lg border border-gray-800 p-6 md:p-8 mb-8">{children}</div>

        {/* Navigation buttons */}
        <div className="flex justify-between w-full">
          <button
            onClick={onBack}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isFirstStep
                ? "opacity-50 cursor-not-allowed bg-gray-800 text-gray-500"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {!hideNext && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2 rounded-md bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] hover:opacity-90 transition-opacity text-white"
            >
              {isLastStep ? "Complete" : "Next"}
              {!isLastStep && <ArrowRight size={16} />}
            </button>
          )}
          {hideNext && <div />}
        </div>
      </div>
    </div>
  )
}
