"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import OnboardingLayout from "@/components/Onboarding/OnboardingLayout"
import StepOne from "@/components/Onboarding/StepOne"
import StepTwo from "@/components/Onboarding/StepTwo"
import StepThree from "@/components/Onboarding/StepThree"
import StepFour from "@/components/Onboarding/StepFour"
import StepFive from "@/components/Onboarding/StepFive"

export default function OnboardingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const stepParam = searchParams?.get("step")
  const currentStep = stepParam ? Math.max(1, Math.min(5, parseInt(stepParam, 10) || 1)) : 1
  const totalSteps = 5

  // Form data state
  const [email, setEmail] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed">("pending")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Step titles
  const stepTitles = ["Get Started", "Verify Email", "Choose Your Plan", "Payment Information", "Setup Complete"]

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps) {
      router.push(`/onboarding?step=${currentStep + 1}`)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(`/onboarding?step=${currentStep - 1}`)
    }
  }

  // Step-specific handlers
  const handleEmailSubmit = () => {
    // In a real app, you would send a verification email here
    handleNext()
  }

  const handleEmailVerified = () => {
    setVerificationStatus("verified")
    // Auto-advance after verification
    setTimeout(() => {
      handleNext()
    }, 2000)
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne email={email} setEmail={setEmail} />
      case 2:
        return <StepTwo email={email} />
      case 3:
        return (
          <StepThree
            selectedPlan={selectedPlan}
            onSelectPlan={handleSelectPlan}
          />
        )
      case 4:
        return (
          <StepFour
            selectedPlan={selectedPlan || "professional"}
          />
        )
      case 5:
        return <StepFive selectedPlan={selectedPlan || "professional"} email={email} />
      default:
        return null
    }
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onBack={handleBack}
      isFirstStep={currentStep === 1}
      isLastStep={currentStep === totalSteps}
      title={stepTitles[currentStep - 1]}
      hideNext={currentStep === 4}
    >
      {renderStep()}
    </OnboardingLayout>
  )
}
