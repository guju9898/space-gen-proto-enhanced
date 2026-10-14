import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import { HumanPolishPage } from "@/components/human-polish/marketing/HumanPolishPage"

export const metadata: Metadata = pageMetadata({
  path: "/human-polish",
  title: "Human Polish™: Done-for-You Renderings",
  description:
    "Human Polish is the done-for-you service from Renderspace: AI Render Packs and Build-Ready presentation packages for contractors and design-build teams.",
})

export default function HumanPolishRoute() {
  return <HumanPolishPage />
}
