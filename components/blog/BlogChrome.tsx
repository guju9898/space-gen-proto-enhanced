import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

export function BlogHeader() {
  return <SiteHeader active="blog" cta={{ href: "/onboarding?plan=starter", label: "First Job Test" }} />
}

export function BlogFooter() {
  return <SiteFooter className="mt-16" />
}
