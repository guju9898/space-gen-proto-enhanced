"use client"

import { useState } from "react"
import { CreditCard, Lock, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/AuthContext"

interface StepFourProps {
  selectedPlan: string
}

const planDetails: Record<string, { name: string; price: number; credits: number }> = {
  professional: {
    name: "Professional",
    price: 98,
    credits: 500,
  },
  business: {
    name: "Business",
    price: 349,
    credits: 6000,
  },
}

export default function StepFour({ selectedPlan }: StepFourProps) {
  const { openLoginModal } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = planDetails[selectedPlan] || planDetails.professional

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check authentication
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        // Store pending checkout plan for auto-resume after login
        sessionStorage.setItem("pending_checkout_plan", selectedPlan)
        openLoginModal()
        setIsLoading(false)
        return
      }

      // Create checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan,
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
          <h3 className="font-bold text-lg mb-4">{plan.name} Plan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly subscription</span>
              <span className="text-white font-medium">${plan.price.toFixed(2)} / month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Credits included</span>
              <span className="text-white font-medium">{plan.credits} per month</span>
            </div>
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
          onClick={handleCheckout}
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
