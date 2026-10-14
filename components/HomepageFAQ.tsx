"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqFor } from "@/lib/seo/faq"

const faqItems = faqFor("home")

export function HomepageFAQ() {
  return (
    <section id="faq" className="container mx-auto px-4 py-16">
      <h2 className="text-2xl md:text-3xl font-bold mb-12 text-white text-center">FAQ</h2>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border border-[#343434] rounded-lg overflow-hidden bg-transparent px-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left text-white hover:no-underline hover:bg-white/5">
                {item.q}
              </AccordionTrigger>
              {/* forceMount keeps every answer in the server HTML so search and AI crawlers can read it. */}
              <AccordionContent forceMount className="px-4 pb-4 text-muted-foreground text-sm">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
