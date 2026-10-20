/**
 * Entity structured data (schema.org JSON-LD).
 *
 * Every node has a stable absolute @id so graphs on different pages refer to
 * the same Organization / WebSite / SoftwareApplication / Service.
 *
 * Deliberately NOT included:
 * - aggregateRating / review: no real third-party reviews yet. Google's
 *   Rich Results Test will report SoftwareApplication as missing these; that's
 *   expected. Never add self-made ratings.
 * - SearchAction: the site has no search.
 */

import {
  HUMAN_POLISH_BUILD_READY,
  HUMAN_POLISH_RENDER_PACKS,
  PLANS,
  SITE,
  count,
  type Plan,
  type ServicePackage,
} from "./facts"

export const ORG_ID = `${SITE.url}/#organization`
export const WEBSITE_ID = `${SITE.url}/#website`
export const SOFTWARE_ID = `${SITE.url}/#software`
export const HUMAN_POLISH_SERVICE_ID = `${SITE.url}/human-polish#service`

const CONTEXT = "https://schema.org"
const LOGO_URL = `${SITE.url}${SITE.logoPath}`

export function organizationLd() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: SITE.logoSize,
      height: SITE.logoSize,
    },
    founder: { "@type": "Person", name: SITE.founder },
    ...(SITE.sameAs.length ? { sameAs: [...SITE.sameAs] } : {}),
  }
}

export function websiteLd() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    alternateName: ["renderspace.ai", "Render Space"],
    url: SITE.url,
    publisher: { "@id": ORG_ID },
  }
}

/** Organization + WebSite, rendered once per page from the root layout. */
export function siteGraphLd() {
  return { "@context": CONTEXT, "@graph": [organizationLd(), websiteLd()] }
}

function planOffer(plan: Plan) {
  const unit = plan.period === "week" ? "week" : "month"
  const description = `${count(plan.credits)} credits per ${unit}, ${plan.resolution} export`
  return {
    "@type": "Offer",
    name: plan.name,
    description,
    price: plan.priceUsd,
    priceCurrency: "USD",
    url: `${SITE.url}/pricing`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: plan.priceUsd,
      priceCurrency: "USD",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: 1,
        unitCode: plan.period === "week" ? "WEE" : "MON",
      },
    },
  }
}

export function softwareApplicationLd() {
  return {
    "@context": CONTEXT,
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: SITE.name,
    url: SITE.url,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    description:
      "AI concept renderings from a job-site photo. Contractors and designers upload a photo of a real space and get a photorealistic interior, exterior or landscape concept in about 30 seconds.",
    publisher: { "@id": ORG_ID },
    offers: [PLANS.starter, PLANS.professional, PLANS.business].map(planOffer),
  }
}

function packageOffer(pkg: ServicePackage) {
  return {
    "@type": "Offer",
    name: pkg.name,
    description: `Delivery target: ${pkg.delivery}`,
    price: pkg.priceUsd,
    priceCurrency: "USD",
    url: `${SITE.url}/human-polish`,
  }
}

export function humanPolishServiceLd() {
  return {
    "@context": CONTEXT,
    "@type": "Service",
    "@id": HUMAN_POLISH_SERVICE_ID,
    name: "Human Polish™",
    serviceType: "Done-for-you rendering and presentation service for contractors",
    description:
      "Human Polish is the done-for-you service from Renderspace: AI Render Packs and Build-Ready presentation packages for contractors and design-build teams. Visualization and presentation support only, not architecture, engineering, permits, or stamped plans.",
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "United States" },
    url: `${SITE.url}/human-polish`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Human Polish packages",
      itemListElement: [...HUMAN_POLISH_RENDER_PACKS, ...HUMAN_POLISH_BUILD_READY].map(packageOffer),
    },
  }
}
