import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { humanPolishServiceLd } from "@/lib/seo/schema"
import { HumanPolishPage } from "@/components/human-polish/marketing/HumanPolishPage"

export const metadata: Metadata = pageMetadata({
  path: "/human-polish",
  title: "Human Polish™: Done-for-You AI Render Packs",
  description:
    "Done-for-you AI renderings for contractors: packs of 25, 50 or 100 concepts from $399 ($349 on a first pack), plus 2D and 3D presentation plans.",
})

export default function HumanPolishRoute() {
  return (
    <>
      <JsonLd data={humanPolishServiceLd()} />
      <HumanPolishPage />
    </>
  )
}
