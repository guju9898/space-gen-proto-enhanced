import type { Metadata } from "next"
import { HumanPolishPage } from "@/components/human-polish/marketing/HumanPolishPage"

export const metadata: Metadata = {
  title: "Human Polish™ | Your Outsourced Visualization Department | Renderspace",
  description:
    "Human Polish is Renderspace’s done-for-you visualization service: AI Render Packs and Build-Ready presentation packages for contractors and design-build teams.",
}

export default function HumanPolishRoute() {
  return <HumanPolishPage />
}
