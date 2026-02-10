"use client"

interface Plan {
  id: string
  name: string
  price: number
  credits: number
  description: string
  isPopular?: boolean
}

interface StepThreeProps {
  selectedPlan: string | null
  onSelectPlan: (planId: string) => void
}

export default function StepThree({ selectedPlan, onSelectPlan }: StepThreeProps) {
  const plans: Plan[] = [
    {
      id: "professional",
      name: "Professional",
      price: 98,
      credits: 500,
      description: "generations / credits per month",
      isPopular: true,
    },
    {
      id: "business",
      name: "Business",
      price: 349,
      credits: 6000,
      description: "generations / credits per month",
    },
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-400">
          Select the plan that best fits your design needs
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border ${
              selectedPlan === plan.id ? "border-[#ec4899]" : "border-gray-700 hover:border-gray-600"
            } p-5 transition-colors cursor-pointer`}
            onClick={() => onSelectPlan(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 right-4 bg-[#8b5cf6] text-white text-xs px-3 py-1 rounded-full">
                Popular
              </div>
            )}

            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
            <p className="text-xs text-gray-400 mb-4">Monthly subscription</p>

            <div className="mb-4">
              <span className="text-2xl font-bold">${plan.price.toFixed(2)}</span>
              <span className="text-sm text-gray-400"> / month</span>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              {plan.credits} {plan.description}
            </p>

            <button
              className={`w-full py-2 rounded-md transition-colors ${
                selectedPlan === plan.id
                  ? "bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
