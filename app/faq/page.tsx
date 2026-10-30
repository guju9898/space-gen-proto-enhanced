import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import Link from "next/link"
import { SiteHeader } from "@/components/site/SiteHeader"
import { ChevronRight } from "lucide-react"
import { JsonLd } from "@/components/seo/JsonLd"
import { faqFor, faqPageLd } from "@/lib/seo/faq"
import { SiteFooter } from "@/components/site/SiteFooter"

const faqs = faqFor("faq")

export const metadata: Metadata = pageMetadata({
  path: "/faq",
  title: "AI Rendering FAQ: Speed, Credits and Licensing",
  description:
    "How fast an AI rendering from a job-site photo is (about 30 seconds), how credits work, 4K export, using renders in proposals and ads, and canceling.",
})

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={faqPageLd(faqs)} />
      <SiteHeader active="faq" />
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Frequently asked questions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to know about Renderspace.</p>
      </section>
      <section className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.id} id={faq.id} className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434]">
              <h2 className="text-lg font-bold text-white mb-3">{faq.q}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-12 text-muted-foreground">
          Building a proposal? Read <Link href="/blog/visual-proposals-for-homeowners" className="text-primary hover:underline">how to make a visual proposal for homeowners</Link>, or <Link href="/pricing" className="text-primary hover:underline inline-flex items-center gap-1">view pricing <ChevronRight className="w-4 h-4" /></Link>.
        </p>
      </section>
      <SiteFooter className="mt-16" />
    </div>
  )
}
