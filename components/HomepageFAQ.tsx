"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems: { question: string; answer: string }[] = [
  {
    question: "Questions about using Renderspace?",
    answer: "Renderspace lets you upload a photo and generate photorealistic design concepts in seconds. Choose interior, exterior, or landscape, adjust style and mood, then hit generate. Use the results to align with clients or explore options before committing to a direction.",
  },
  {
    question: "What is Renderspace best used for?",
    answer: "Early-stage concept visualization, client presentations, and exploring multiple design directions quickly. It’s ideal for contractors, designers, and remodelers who want to show clients what a space could look like without detailed drawings.",
  },
  {
    question: "Can I customize the generated designs?",
    answer: "Yes. You control room or building type, style, color palette, lighting, mood, and advanced options like geometry and symmetry. You can also type your own descriptors for finer control over the look and feel.",
  },
  {
    question: "What file formats do you support?",
    answer: "For uploads we support JPG, PNG, and WEBP (max 10MB). Generated renders can be downloaded and used in your usual workflows.",
  },
  {
    question: "How many designs can I generate?",
    answer: "It depends on your plan. Credits are used per successful generation. Check the Pricing page for your plan’s included credits and usage.",
  },
  {
    question: "Can I use the designs commercially?",
    answer: "Yes. Our Business plan includes commercial license for client work and marketing. See Pricing for plan details.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept major credit cards and standard subscription billing. Payment is handled securely through our billing provider.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes. You can cancel anytime from your account. You’ll keep access until the end of your billing period.",
  },
]

export function HomepageFAQ() {
  return (
    <section id="faq" className="container mx-auto px-4 py-16">
      <h2 className="text-2xl md:text-3xl font-bold mb-12 text-white text-center">FAQ</h2>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-[#343434] rounded-lg overflow-hidden bg-transparent px-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left text-white hover:no-underline hover:bg-white/5">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground text-sm">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
