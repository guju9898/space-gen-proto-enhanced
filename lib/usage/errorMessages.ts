/**
 * Maps credit enforcement denial reasons to user-friendly messages
 */
export function getCreditErrorMessage(errorCode: string | undefined): string {
  switch (errorCode) {
    case "no_plan":
      return "You need an active plan to generate designs."
    case "past_due":
      return "Your subscription needs attention before you can generate again."
    case "credits_exhausted":
      return "You've used all your credits for this period."
    case "intro_period_ended":
      return "This week's Intro Plan credits have ended. They renew at your next weekly charge."
    case "subscription_inactive":
      return "Your subscription needs attention before you can generate again."
    case "capacity_reached":
      return "You've used all your credits for this period."
    default:
      return "Unable to generate design. Please check your subscription."
  }
}


