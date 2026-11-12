interface OrderSummaryProps {
  planName: string
  planPrice: number
  billingPeriod: string
}

export default function OrderSummary({ planName, planPrice, billingPeriod }: OrderSummaryProps) {
  // Format price to always show 2 decimal places
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  // Calculate tax (if applicable)
  const tax = 0 // In a real app, this would be calculated based on location and tax rules
  const subtotal = planPrice
  const total = subtotal + tax

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">{/plan$/i.test(planName) ? planName : `${planName} plan`}</h3>
          <p className="text-sm text-gray-400">Billed {billingPeriod}</p>
        </div>
        <span className="font-bold">{formatPrice(planPrice)}</span>
      </div>

      <div className="border-t border-zinc-800 my-4"></div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Tax if applicable</span>
          <span>{tax > 0 ? formatPrice(tax) : "-"}</span>
        </div>
      </div>

      <div className="border-t border-zinc-800 my-4"></div>

      <div className="flex justify-between font-bold">
        <span>Total due today</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  )
}
