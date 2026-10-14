/**
 * Single source of truth for FAQ content.
 * - `surfaces` controls where each item appears (homepage accordion and/or /faq).
 * - FAQPage JSON-LD is rendered on /faq only (Google: mark up a given FAQ in one place).
 * - Answers must open with a direct answer, then detail.
 * - Prices and credit counts come from ./facts — never retype them.
 */

import {
  HUMAN_POLISH_BUILD_READY,
  HUMAN_POLISH_RENDER_PACKS,
  PLANS,
  PROOF,
  UPLOAD_LIMITS,
  UPLOAD_RETENTION_DAYS,
  USAGE_RIGHTS,
  count,
  usd,
} from "./facts"

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
    a: `Renderspace is an AI rendering tool for outdoor contractors, remodelers and designers. Upload a photo of a real yard, home exterior or room, choose a style, and get a photorealistic concept in about ${PROOF.secondsPerConcept.typical} seconds, so your client can see the finished project before you quote. More than ${PROOF.rendersGenerated} renders have been generated so far.`,
    surfaces: ["home", "faq"],
  },
  {
    id: "vs-chatgpt",
    q: "Can't I just do this with ChatGPT or Gemini?",
    a: "You can get an image from ChatGPT or Gemini, but they're general-purpose tools that need careful prompting and don't stay consistent from one image to the next. Renderspace is built for one job: turning a photo of your client's actual property into a client-ready concept. You choose the space type, style, materials, lighting and mood from presets instead of writing prompts, keep those settings while you change one thing, export in 4K, and share the result with your client. It's fast enough to use during the estimate.",
    surfaces: ["home", "faq"],
  },
  {
    id: "keep-variables",
    q: "Can I keep the same settings and just change a few things?",
    a: "Yes. Your settings (space type, style, color palette, lighting, mood, and advanced options like geometry and symmetry) carry over between generations, so you can change one thing, such as the pavers or the pool shape, and generate again. Because it's AI, small details can still vary between generations, so create a couple of options and pick the closest.",
    surfaces: ["home", "faq"],
  },
  {
    id: "how-long",
    q: "How long does it take to get a rendering?",
    a: `About ${PROOF.secondsPerConcept.typical} seconds per concept (typically ${PROOF.secondsPerConcept.min}–${PROOF.secondsPerConcept.max} seconds) once your photo is uploaded. If you'd rather have our team produce a finished set, Human Polish render packs are delivered in ${HUMAN_POLISH_RENDER_PACKS[0].delivery} for ${HUMAN_POLISH_RENDER_PACKS[0].name.replace("AI Render Pack: ", "")}.`,
    surfaces: ["home", "faq"],
  },
  {
    id: "permits",
    q: "Can I use Renderspace for permit plans?",
    a: `No. Renderspace creates concept visualizations for early design decisions and sales conversations. It does not produce construction drawings, permit plans, engineering, or stamped documents. For HOA or design-review presentations, Human Polish Build-Ready packages (from ${usd(HUMAN_POLISH_BUILD_READY[0].priceUsd)}) give you presentation-grade materials; permits still need to go through a licensed professional.`,
    surfaces: ["home", "faq"],
  },
  {
    id: "add-pool",
    q: "Can it add a pool or patio to a photo of a plain backyard?",
    a: "Yes. Upload a photo of the existing yard and Renderspace can add a pool, patio, pergola, outdoor kitchen, fire pit, paths or planting to that same yard. The same works for home exteriors (siding, roofing, entries) and interiors.",
    surfaces: ["home", "faq"],
  },
  {
    id: "phone-photo",
    q: "Does it work from a phone photo?",
    a: `Yes. A clear daytime phone photo taken from where the homeowner would normally stand works best. Uploads can be ${UPLOAD_LIMITS.formats}, up to ${UPLOAD_LIMITS.maxMb}MB.`,
    surfaces: ["faq"],
  },
  {
    id: "commercial",
    q: "Can I use the renders commercially?",
    a: `Yes, on every paid plan. ${USAGE_RIGHTS}`,
    surfaces: ["home", "faq"],
  },
  {
    id: "credits",
    q: "How do credits work?",
    a: `Each AI-generated image uses one credit. Professional plans include ${count(PLANS.professional.credits)} credits per month; Business plans include ${count(PLANS.business.credits)}. Unused credits do not roll over. You can upgrade or downgrade your plan at any time.`,
    surfaces: ["faq"],
  },
  {
    id: "first-job-test",
    q: "What is the First Job Test?",
    a: `A ${usd(PLANS.starter.priceUsd)} trial: ${PLANS.starter.credits} credits to use over ${PLANS.starter.period} on a real job. It's non-refundable, and it automatically upgrades to Professional (${usd(PLANS.professional.priceUsd)}/month) if you decide to continue.`,
    surfaces: ["faq"],
  },
  {
    id: "resolution",
    q: "What resolution are the images?",
    a: "All plans include 4K (3840x2160) export, so your renders are print- and presentation-ready.",
    surfaces: ["faq"],
  },
  {
    id: "training",
    q: "Do you train AI on my photos?",
    a: "No. We don't use customer photos to train AI models, and we don't share your data with third parties. Payments are handled by Stripe.",
    surfaces: ["faq"],
  },
  {
    id: "retention",
    q: "How long do you keep my uploaded photos?",
    a: `Uploaded photos stay in your account for ${UPLOAD_RETENTION_DAYS} days and are then deleted.`,
    surfaces: ["faq"],
  },
  {
    id: "cancel",
    q: "Can I cancel my subscription?",
    a: "Yes. There's no long-term commitment. Cancel from your account settings and you keep access until the end of your billing period.",
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
