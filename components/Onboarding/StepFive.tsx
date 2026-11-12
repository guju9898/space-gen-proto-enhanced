import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { CATALOG, type PlanCode } from "@/lib/pricing/catalog"

interface StepFiveProps {
  selectedPlan: string
  email: string
}

export default function StepFive({ selectedPlan, email }: StepFiveProps) {
  const planCode: PlanCode =
    selectedPlan === "intro" || selectedPlan === "business" ? selectedPlan : "professional"
  const planName = CATALOG[planCode].name
  const planLabel = /plan$/i.test(planName) ? planName : `${planName} plan`

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-500" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-4">You&apos;re all set</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Your {planLabel} is active. We&apos;ve sent a confirmation email to {email}.
      </p>

      <div className="bg-gray-800/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
        <h3 className="font-medium mb-2">Your first concept takes about a minute</h3>
        <ol className="text-sm text-gray-400 text-left space-y-2 list-decimal list-inside">
          <li>Take or upload a photo of the job site.</li>
          <li>Pick the style and the main materials.</li>
          <li>Render, then compare it with your photo.</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/studio"
          className="px-6 py-3 bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] rounded-md text-white font-medium hover:opacity-90 transition-opacity"
        >
          Open the Studio
        </Link>
        <Link
          href="/academy/photographing-a-job-site"
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-white font-medium transition-colors"
        >
          Read the photo guide
        </Link>
      </div>
    </div>
  )
}
