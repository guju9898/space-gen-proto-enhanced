interface SubscriptionDisclaimerProps {
  className?: string
}

export default function SubscriptionDisclaimer({ className = "" }: SubscriptionDisclaimerProps) {
  return (
    <div className={`text-xs text-gray-400 ${className}`}>
      <p>
        By confirming your subscription, you allow Renderspace to charge you for future payments in accordance with their
        terms. You can always cancel your subscription.
      </p>
      <div className="mt-2 p-3 bg-zinc-800 rounded-md border-l-4 border-yellow-500">
        <p className="font-medium text-white">Important: This is a recurring subscription</p>
        <p className="mt-1">
          Your card will be automatically charged on a recurring basis until you cancel. You can cancel anytime from
          your account settings.
        </p>
      </div>
    </div>
  )
}
