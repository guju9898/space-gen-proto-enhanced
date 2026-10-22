import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import { ContractorDemoPage } from "@/components/contractor-demo/ContractorDemoPage"

export const metadata: Metadata = pageMetadata({
  path: "/contractor-demo",
  title: "Contractor Demo: Show the Job Before You Quote",
  description:
    "For landscaping and outdoor living contractors: turn a photo of the client's yard into a photorealistic concept in about 30 seconds and show it on site.",
})

export default function ContractorDemoRoute() {
  return <ContractorDemoPage />
}
