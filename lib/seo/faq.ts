/**
 * Single source of truth for FAQ content.
 * - `surfaces` controls where each item appears (homepage accordion and/or /faq).
 * - FAQPage JSON-LD is rendered on /faq only (Google: mark up a given FAQ in one place).
 * - Answers must open with a direct answer, then detail.
 * - Prices and credit counts come from ./facts — never retype them.
 */

import { PLANS, count } from "./facts"

export type FaqSurface = "home" | "faq"

export type FaqItem = {
  id: string
  q: string
  a: string
  surfaces: FaqSurface[]
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is",
    q: "What is Renderspace?",
    a: "Renderspace is an AI-powered design tool that turns photos of real spaces into client-ready interior, exterior, and landscape concepts. Upload a photo, choose a style, and get high-resolution visuals in minutes. Use the results to align with clients or explore options before committing to a direction.",
    surfaces: ["home", "faq"],
  },
  {
    id: "best-for",
    q: "What is Renderspace best used for?",
    a: "Early-stage concept visualization, client presentations, and exploring multiple design directions quickly. It’s ideal for contractors, designers, and remodelers who want to show clients what a space could look like without detailed drawings.",
    surfaces: ["home", "faq"],
  },
  {
    id: "credits",
    q: "How do credits work?",
    a: `Each AI-generated image uses one credit. Professional plans include ${count(PLANS.professional.credits)} credits per month; Business plans include ${count(PLANS.business.credits)}. Unused credits do not roll over. You can upgrade or downgrade your plan at any time.`,
    surfaces: ["faq"],
  },
  {
    id: "how-many",
    q: "How many designs can I generate?",
    a: "It depends on your plan. Credits are used per successful generation. Check the Pricing page for your plan’s included credits and usage.",
    surfaces: ["home"],
  },
  {
    id: "customize",
    q: "Can I customize the generated designs?",
    a: "Yes. You control room or building type, style, color palette, lighting, mood, and advanced options like geometry and symmetry. You can also type your own descriptors for finer control over the look and feel.",
    surfaces: ["home", "faq"],
  },
  {
    id: "resolution",
    q: "What resolution are the images?",
    a: "All plans include 4K (3840x2160) export so your renders are print- and presentation-ready. Downloads are available in standard image formats.",
    surfaces: ["faq"],
  },
  {
    id: "formats",
    q: "What file formats do you support?",
    a: "For uploads we support JPG, PNG, and WEBP (max 10MB). Generated renders can be downloaded and used in your usual workflows.",
    surfaces: ["home", "faq"],
  },
  {
    id: "commercial",
    q: "Can I use renders commercially?",
    a: "Yes. The Business plan includes a commercial license so you can use generated images in client proposals, marketing, and paid projects. The Professional plan is for personal and internal use.",
    surfaces: ["home", "faq"],
  },
  {
    id: "security",
    q: "Is my data secure?",
    a: "We process uploads and store assets securely. We do not train our AI on your images or share your data with third parties. Payments are handled by Stripe.",
    surfaces: ["faq"],
  },
  {
    id: "payment",
    q: "What payment methods do you accept?",
    a: "We accept major credit cards and standard subscription billing. Payment is handled securely through our billing provider.",
    surfaces: ["home", "faq"],
  },
  {
    id: "cancel",
    q: "Can I cancel my subscription?",
    a: "Yes. There is no long-term commitment. You can cancel from your account settings, and you will keep access until the end of your billing period.",
    surfaces: ["home", "faq"],
  },
]

export function faqFor(surface: FaqSurface): FaqItem[] {
  return FAQ_ITEMS.filter((item) => item.surfaces.includes(surface))
}

export function faqPageLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }
}
