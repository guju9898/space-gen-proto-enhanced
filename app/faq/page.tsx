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
  title: "FAQ: Credits, Licensing, Exports and Billing",
  description:
    "Answers about Renderspace credits, 4K exports, commercial licensing, data privacy, supported uploads and canceling. What the tool is for and what it is not.",
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
          Still have questions? <Link href="/pricing" className="text-primary hover:underline inline-flex items-center gap-1">View pricing <ChevronRight className="w-4 h-4" /></Link>
        </p>
      </section>
      <SiteFooter className="mt-16" />
    </div>
  )
}
