"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import FormInput from "./FormInput"
import CardNumberInput from "./CardNumberInput"
import OrderSummary from "./OrderSummary"
import SubscriptionDisclaimer from "./SubscriptionDisclaimer"
import { validateEmail, validateCardNumber, validateExpiryDate, validateCVV } from "@/lib/validation"

interface PaymentFormProps {
  planName: string
  planPrice: number
  billingPeriod: string
  onClose: () => void
  onSubmit: (paymentDetails: PaymentDetails) => Promise<void>
}

export interface PaymentDetails {
  email: string
  cardholderName: string
  cardNumber: string
  expiryDate: string
  cvv: string
}

export default function PaymentForm({ planName, planPrice, billingPeriod, onClose, onSubmit }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PaymentDetails, string>>>({})

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    email: "",
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  })

  const handleInputChange = (field: keyof PaymentDetails, value: string) => {
    setPaymentDetails((prev) => ({ ...prev, [field]: value }))

    // Clear error when user types
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PaymentDetails, string>> = {}

    if (!validateEmail(paymentDetails.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!paymentDetails.cardholderName.trim()) {
      errors.cardholderName = "Cardholder name is required"
    }

    if (!validateCardNumber(paymentDetails.cardNumber)) {
      errors.cardNumber = "Please enter a valid card number"
    }

    if (!validateExpiryDate(paymentDetails.expiryDate)) {
      errors.expiryDate = "Please enter a valid expiry date (MM/YY)"
    }

    if (!validateCVV(paymentDetails.cvv)) {
      errors.cvv = "Please enter a valid CVV"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(paymentDetails)
      // Success handling would happen in the parent component
    } catch (error) {
      console.error("Payment submission error:", error)
      // Handle submission error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-black text-white rounded-lg max-w-4xl w-full overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row">
          {/* Payment Information Section */}
          <div className="flex-1 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{planName} plan</h2>
              <button onClick={() => onClose()} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-6">Great choice! Fill in your payment information</p>

            <form onSubmit={handleSubmit}>
              <FormInput
                id="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={paymentDetails.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                error={formErrors.email}
                required
              />

              <FormInput
                id="cardholderName"
                label="Cardholder name"
                placeholder="Enter your cardholder name"
                value={paymentDetails.cardholderName}
                onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                error={formErrors.cardholderName}
                required
              />

              <CardNumberInput
                value={paymentDetails.cardNumber}
                onChange={(value) => handleInputChange("cardNumber", value)}
                error={formErrors.cardNumber}
              />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <FormInput
                    id="expiryDate"
                    label="Date due"
                    placeholder="MM/YY"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "")
                      if (value.length <= 4) {
                        const formatted = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value
                        handleInputChange("expiryDate", formatted)
                      }
                    }}
                    error={formErrors.expiryDate}
                    required
                    maxLength={5}
                  />
                </div>
                <div>
                  <FormInput
                    id="cvv"
                    label="CVV"
                    placeholder="CVC"
                    value={paymentDetails.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "")
                      if (value.length <= 3) {
                        handleInputChange("cvv", value)
                      }
                    }}
                    error={formErrors.cvv}
                    required
                    maxLength={3}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary Section */}
          <div className="bg-zinc-900 flex-1 p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">Order summary</h2>

            <OrderSummary planName={planName} planPrice={planPrice} billingPeriod={billingPeriod} />

            <button
              type="submit"
              onClick={(e) => handleSubmit(e)}
              disabled={isSubmitting}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Subscribe"}
            </button>

            <SubscriptionDisclaimer className="mt-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
