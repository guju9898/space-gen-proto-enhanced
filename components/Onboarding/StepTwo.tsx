"use client"

import { useState } from "react"
import { Check, Info } from "lucide-react"

interface StepTwoProps {
  email: string
  verificationStatus: "pending" | "verified" | "failed"
  onVerified: () => void
}

export default function StepTwo({ email, verificationStatus, onVerified }: StepTwoProps) {
  // Mock verification process
  const [isVerifying, setIsVerifying] = useState(false)

  const handleResendVerification = () => {
    setIsVerifying(true)
    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false)
      onVerified()
    }, 2000)
  }

  return (
    <div className="flex flex-col items-center">
      {verificationStatus === "verified" ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Your email has been successfully verified</h2>
          <p className="text-gray-400 mb-4">Just wait a little and you can choose the plan you need</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info size={32} className="text-[#ec4899]" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Verify your email address</h2>
          <p className="text-gray-400 mb-6">
            We've sent a verification link to <span className="text-white font-medium">{email}</span>. Please check your
            inbox and click the link to verify your email.
          </p>

          <div className="p-4 bg-gray-800/50 rounded-md mb-6 text-sm text-gray-300">
            <p>Didn't receive the email? Check your spam folder or click below to resend.</p>
          </div>

          <button
            onClick={() => handleResendVerification()}
            disabled={isVerifying}
            className={`px-6 py-2 rounded-md transition-colors ${
              isVerifying ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
          >
            {isVerifying ? "Sending..." : "Resend Verification Email"}
          </button>
        </div>
      )}
    </div>
  )
}
