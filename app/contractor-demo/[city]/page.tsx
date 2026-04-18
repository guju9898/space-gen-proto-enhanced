import type { Metadata } from "next"
import { ContractorDemoPage } from "@/components/contractor-demo/ContractorDemoPage"

const CITY_LABELS: Record<string, string> = {
  houston: "Houston",
  dallas: "Dallas",
  austin: "Austin",
}

interface ContractorCityPageProps {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: ContractorCityPageProps): Promise<Metadata> {
  const { city } = await params
  const normalized = city.toLowerCase()
  const cityLabel = CITY_LABELS[normalized] ?? null

  if (!cityLabel) {
    return {
      title: "Contractor Demo | Outdoor Living Sales Funnel | Renderspace",
      description:
        "See how landscaping and outdoor living contractors close projects faster with visual before/after concepts and a premium done-for-you system.",
    }
  }

  return {
    title: `${cityLabel} Contractor Demo | Close More Backyard Projects | Renderspace`,
    description: `Contractors in ${cityLabel}: show homeowners the finished backyard vision before quoting. Close landscaping, patio, pergola, and hardscaping jobs faster with Renderspace.`,
  }
}

export default async function ContractorCityPage({ params }: ContractorCityPageProps) {
  const { city } = await params
  return <ContractorDemoPage citySlug={city} />
}

