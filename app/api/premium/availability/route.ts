import { NextResponse } from "next/server"
import { readPremiumAvailability, type PremiumService } from "@/lib/premium/availability"

export const runtime = "nodejs"

const SERVICES = new Set<PremiumService>(["premium_onboarding", "mailer", "human_polish"])

export async function GET(request: Request) {
  const service = new URL(request.url).searchParams.get("service")
  if (!service || !SERVICES.has(service as PremiumService)) {
    return NextResponse.json({ error: "Unknown service" }, { status: 400 })
  }
  return NextResponse.json(readPremiumAvailability(service as PremiumService))
}
