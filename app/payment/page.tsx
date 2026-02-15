"use client"

import { useState } from "react"
import PaymentForm, { type PaymentDetails } from "@/components/payment/PaymentForm"

export default function PaymentPage() {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Mock plan details - in a real app, this would come from your state management or API
  const planDetails = {
    name: "Personal",
    price: 37.95,
    billingPeriod: "monthly",
  }

  const handleOpenPaymentForm = () => {
    setShowPaymentForm(true)
  }

  const handleClosePaymentForm = () => {
    setShowPaymentForm(false)
  }

  const handlePaymentSubmit = async (paymentDetails: PaymentDetails) => {
    setIsProcessing(true)

    try {
      // This would be replaced with your actual payment processing logic
      // e.g., calling Stripe or Paddle API
      console.log("Processing payment with details:", paymentDetails)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful payment
      setPaymentSuccess(true)
      setShowPaymentForm(false)

      // In a real app, you would redirect to a success page or the next step
      // router.push('/onboarding/success')
    } catch (error) {
      console.error("Payment failed:", error)
      // Handle payment failure
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-6">Space Gen Subscription</h1>

        {paymentSuccess ? (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <p className="mb-4">Your subscription has been activated.</p>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-black rounded-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Personal Plan</h2>
            <p className="text-gray-400 mb-2">Get access to all premium features</p>
            <p className="text-2xl font-bold mb-6">${planDetails.price} / month</p>

            <button
              onClick={() => handleOpenPaymentForm()}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white py-3 rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Subscribe Now"}
            </button>
          </div>
        )}
      </div>

      {showPaymentForm && (
        <PaymentForm
          planName={planDetails.name}
          planPrice={planDetails.price}
          billingPeriod={planDetails.billingPeriod}
          onClose={handleClosePaymentForm}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  )
}
