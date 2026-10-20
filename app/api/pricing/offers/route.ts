import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripePriceIds, introRollsIntoProfessional } from "@/lib/stripe/plans"

export const runtime = "nodejs"

async function verifiedAnnualCents(priceId: string | null): Promise<number | null> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!priceId || !key) return null
  try {
    const stripe = new Stripe(key, { apiVersion: "2025-10-29.clover" })
    const price = await stripe.prices.retrieve(priceId)
    if (!price.active || price.currency !== "usd") return null
    if (price.recurring?.interval !== "year" || price.recurring.interval_count !== 1) return null
    if (typeof price.unit_amount !== "number") return null
    return price.unit_amount
  } catch {
    return null
  }
}

/** Public billing availability. Amounts come from Stripe. IDs are not returned. */
export async function GET() {
  const ids = getStripePriceIds()
  const [professionalCents, businessCents] = await Promise.all([
    verifiedAnnualCents(ids.professionalAnnual),
    verifiedAnnualCents(ids.businessAnnual),
  ])
  return NextResponse.json({
    annual: {
      professional: { available: professionalCents !== null, amountCents: professionalCents },
      business: { available: businessCents !== null, amountCents: businessCents },
    },
    rollsIntoProfessional: introRollsIntoProfessional(),
  })
}
