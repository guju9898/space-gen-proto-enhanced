import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { CATALOG, type PlanCode } from "@/lib/pricing/catalog"

interface StepFiveProps {
  selectedPlan: string
  email: string
}

export default function StepFive({ selectedPlan, email }: StepFiveProps) {
  // Capitalize first letter of plan name
  const planCode: PlanCode =
    selectedPlan === "intro" || selectedPlan === "business" ? selectedPlan : "professional"
  const planName = CATALOG[planCode].name

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-500" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-4">Setup Complete!</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Your {planName} plan has been activated successfully. We've sent a confirmation email to {email}.
      </p>

      <div className="bg-gray-800/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
        <h3 className="font-medium mb-2">What's next?</h3>
        <ul className="text-sm text-gray-400 text-left space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-[#ec4899] mt-0.5">•</span>
            <span>Explore the dashboard and get familiar with the tools</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#ec4899] mt-0.5">•</span>
            <span>Set up your profile and preferences</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#ec4899] mt-0.5">•</span>
            <span>Check out our tutorials to get started quickly</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] rounded-md text-white font-medium hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/tutorials"
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-white font-medium transition-colors"
        >
          View Tutorials
        </Link>
      </div>
    </div>
  )
}
