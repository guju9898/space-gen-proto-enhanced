/**
 * Maps credit enforcement denial reasons to user-friendly messages
 */
export function getCreditErrorMessage(errorCode: string | undefined): string {
  switch (errorCode) {
    case "no_plan":
      return "You need an active plan to generate designs."
    case "past_due":
      return "Your subscription needs attention to continue."
    case "credits_exhausted":
      return "You've used all your monthly credits."
    case "subscription_inactive":
      return "Your subscription needs attention to continue."
    case "capacity_reached":
      return "You've used all your monthly credits."
    default:
      return "Unable to generate design. Please check your subscription."
  }
}

