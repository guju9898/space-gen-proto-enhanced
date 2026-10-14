import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import { ContractorDemoPage } from "@/components/contractor-demo/ContractorDemoPage"

export const metadata: Metadata = pageMetadata({
  path: "/contractor-demo",
  title: "Contractor Demo: Close More Outdoor Jobs",
  description:
    "For landscaping and outdoor living contractors: show homeowners before-and-after visuals that close jobs faster, or install our done-for-you premium system.",
})

export default function ContractorDemoRoute() {
  return <ContractorDemoPage />
}
