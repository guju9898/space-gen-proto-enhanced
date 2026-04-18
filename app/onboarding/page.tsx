"use client"

export const dynamic = "force-dynamic"

import { Suspense, useState, useLayoutEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import OnboardingLayout from "@/components/Onboarding/OnboardingLayout"
import StepOne from "@/components/Onboarding/StepOne"
import StepTwo from "@/components/Onboarding/StepTwo"
import StepThree from "@/components/Onboarding/StepThree"
import StepFour from "@/components/Onboarding/StepFour"
import StepFive from "@/components/Onboarding/StepFive"

/** Canonical plan ids used by StepThree / Stripe — ignore unknown query values. */
type OnboardingPlanId = "intro" | "professional" | "business"

function normalizePlanFromQuery(raw: string | null | undefined): OnboardingPlanId | null {
  if (raw == null) return null
  const p = raw.trim().toLowerCase()
  if (p === "intro" || p === "professional" || p === "business") return p
  return null
}

function buildOnboardingHref(step: number, plan: string | null | undefined) {
  const u = new URLSearchParams()
  u.set("step", String(step))
  const canonical = normalizePlanFromQuery(plan ?? null)
  if (canonical) u.set("plan", canonical)
  return `/onboarding?${u.toString()}`
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const stepParam = searchParams?.get("step")
  const planParam = searchParams?.get("plan")
  const currentStep = stepParam ? Math.max(1, Math.min(5, parseInt(stepParam, 10) || 1)) : 1
  const totalSteps = 5

  const [email, setEmail] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed">("pending")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Hydrate from URL before paint so step 3 shows the correct selection immediately (direct load + client nav + refresh).
  useLayoutEffect(() => {
    const fromUrl = normalizePlanFromQuery(planParam)
    if (fromUrl !== null) {
      setSelectedPlan(fromUrl)
    }
  }, [planParam])

  // Step titles
  const stepTitles = ["Get Started", "Verify Email", "Choose Your Plan", "Payment Information", "Setup Complete"]

  const planForUrl = useCallback(() => {
    return normalizePlanFromQuery(selectedPlan) ?? normalizePlanFromQuery(planParam)
  }, [selectedPlan, planParam])

  // Navigation handlers — keep `plan` in the URL when we have one so refresh / remount does not drop deep-linked selection.
  const handleNext = () => {
    if (currentStep < totalSteps) {
      router.push(buildOnboardingHref(currentStep + 1, planForUrl()))
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(buildOnboardingHref(currentStep - 1, planForUrl()))
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

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}
