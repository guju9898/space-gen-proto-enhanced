import type { Metadata } from "next"
import { ContractorDemoPage } from "@/components/contractor-demo/ContractorDemoPage"
import { CITY_LABELS, CITY_SLUGS } from "@/lib/contractor-demo/cities"

interface ContractorCityPageProps {
  params: Promise<{ city: string }>
}

// Only the cities in CITY_LABELS exist. Every other slug 404s instead of
// rendering a duplicate copy of /contractor-demo.
export const dynamicParams = false

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }))
}

export async function generateMetadata({ params }: ContractorCityPageProps): Promise<Metadata> {
  const { city } = await params
  const cityLabel = CITY_LABELS[city.toLowerCase()] ?? city

  return {
    title: `${cityLabel} Contractor Demo: Close More Backyard Projects`,
    description: `Contractors in ${cityLabel}: show homeowners the finished backyard vision before quoting. Close landscaping, patio, pergola, and hardscaping jobs faster with Renderspace.`,
    alternates: { canonical: `/contractor-demo/${city}` },
    // TODO(seo): remove noindex only once this page has unique local content:
    // local project photos, local climate/HOA/permit notes, a local testimonial,
    // and local price ranges. Until then it duplicates /contractor-demo.
    robots: { index: false, follow: true },
  }
}

export default async function ContractorCityPage({ params }: ContractorCityPageProps) {
  const { city } = await params
  return <ContractorDemoPage citySlug={city} />
}
