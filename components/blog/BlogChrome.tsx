import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { PLANS } from "@/lib/seo/facts"

export function BlogHeader() {
  return <SiteHeader active="blog" cta={{ href: "/onboarding?plan=starter", label: PLANS.starter.name }} />
}

export function BlogFooter() {
  return <SiteFooter className="mt-16" />
}
