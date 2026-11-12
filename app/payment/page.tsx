import { redirect } from "next/navigation"

/** Legacy "Space Gen" payment page. Checkout runs through /onboarding and Stripe; send visitors to pricing. */
export default function PaymentPage() {
  redirect("/pricing")
}
