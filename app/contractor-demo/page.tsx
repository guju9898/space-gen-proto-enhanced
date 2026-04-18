import type { Metadata } from "next"
import { ContractorDemoPage } from "@/components/contractor-demo/ContractorDemoPage"

export const metadata: Metadata = {
  title: "Contractor Demo | Close More Outdoor Living Jobs | Renderspace",
  description:
    "Landscaping and outdoor living contractors: stop explaining and start showing. Use before/after visuals to close jobs faster, or install our done-for-you premium system.",
}

export default function ContractorDemoRoute() {
  return <ContractorDemoPage />
}
