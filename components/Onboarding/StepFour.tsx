"use client"

import { useEffect, useState } from "react"
import { CreditCard, Lock, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/AuthContext"
import { CATALOG, introDisclosure, moneyFromCents, type PlanCode } from "@/lib/pricing/catalog"
import { trackPricingEvent } from "@/components/conversion/group-3/analytics"

interface StepFourProps {
  selectedPlan: string
  billingInterval?: "month" | "year"
  promotionId?: string | null
}

export default function StepFour({ selectedPlan, billingInterval = "month", promotionId = null }: StepFourProps) {
  const { openLoginModal } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rollsIntoProfessional, setRollsIntoProfessional] = useState(false)
  const [annualCents, setAnnualCents] = useState<number | null>(null)

  const planCode: PlanCode =
    selectedPlan === "intro" || selectedPlan === "business" ? selectedPlan : "professional"
  const plan = CATALOG[planCode]
  const disclosure = introDisclosure(rollsIntoProfessional)
  const yearly = planCode !== "intro" && billingInterval === "year" && annualCents !== null

  useEffect(() => {
    let cancelled = false
    fetch("/api/pricing/offers")
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          data: {
            rollsIntoProfessional?: boolean
            annual?: { professional?: { amountCents?: number | null }; business?: { amountCents?: number | null } }
          } | null
        ) => {
          if (cancelled || !data) return
          setRollsIntoProfessional(Boolean(data.rollsIntoProfessional))
          const amount =
            planCode === "business" ? data.annual?.business?.amountCents : data.annual?.professional?.amountCents
          setAnnualCents(typeof amount === "number" ? amount : null)
        }
      )
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [planCode])

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check authentication
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        // Store pending checkout plan for auto-resume after login
        sessionStorage.setItem("pending_checkout_plan", planCode)
        sessionStorage.setItem(
          "pending_checkout_interval",
          planCode === "intro" ? "week" : yearly ? "year" : "month"
        )
        if (promotionId) sessionStorage.setItem("pending_checkout_promotion", promotionId)
        openLoginModal(promotionId ? `/onboarding?step=4&promotion=${promotionId}` : "/onboarding?step=4")
        setIsLoading(false)
        return
      }

      const interval = planCode === "intro" ? "week" : yearly ? "year" : "month"
      trackPricingEvent("pricing_checkout_started", { plan: planCode, interval })
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: planCode,
          interval: planCode === "intro" ? "week" : yearly ? "year" : "month",
          ...(promotionId ? { promotionId } : {}),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create checkout session")
      }

      const { url } = await response.json()

      if (!url) {
        throw new Error("No checkout URL returned")
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      console.error("Checkout error:", err)
      setError(err instanceof Error ? err.message : "Failed to start checkout")
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard size={32} className="text-[#ec4899]" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Secure Checkout</h2>
        <p className="text-gray-400">Review your plan and proceed to secure payment</p>
      </div>

      {/* Plan Summary */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h3 className="font-bold text-lg mb-4">{plan.name}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Charged today</span>
              <span className="text-white font-medium">
                {yearly && annualCents !== null
                  ? `${moneyFromCents(annualCents)} / year`
                  : `${moneyFromCents(plan.amountCents)} / ${plan.interval}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Credits included</span>
              <span className="text-white font-medium">
                {plan.credits.toLocaleString("en-US")} {planCode === "intro" ? "each week" : "per month"}
              </span>
            </div>
            <p className="text-xs text-gray-400 pt-2">
              {planCode === "intro"
                ? `${disclosure.renewal} ${disclosure.cancellation} ${disclosure.notOneTime}`
                : yearly
                  ? "Renews automatically every year until you cancel. This is a recurring subscription, not a one-time purchase."
                  : "Renews automatically every month until you cancel. This is a recurring subscription, not a one-time purchase."}
            </p>
            {billingInterval === "year" && !yearly && planCode !== "intro" && (
              <p className="text-xs text-amber-400/90 pt-2">
                Annual billing is not available yet. Checkout uses the monthly price.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-red-900/20 border border-red-500 rounded-md p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 justify-center">
        <Lock size={16} />
        <span>Your payment is processed securely by Stripe</span>
      </div>

      <div className="max-w-md mx-auto">
        <button
          onClick={() => handleCheckout()}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] rounded-md text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to Secure Checkout"
          )}
        </button>
      </div>
    </div>
  )
}
