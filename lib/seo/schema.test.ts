// Run: pnpm tsx --test lib/seo/schema.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  AI_RENDER_PACK_STANDARD_PRICES_CENTS,
  BUILD_READY_STANDARD_PRICES_CENTS,
} from "@/lib/human-polish/config"
import { PLANS, SITE, usd } from "./facts"
import { faqFor, faqPageLd, FAQ_ITEMS } from "./faq"
import {
  HUMAN_POLISH_SERVICE_ID,
  ORG_ID,
  SOFTWARE_ID,
  WEBSITE_ID,
  humanPolishServiceLd,
  siteGraphLd,
  softwareApplicationLd,
} from "./schema"

function collectIds(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => collectIds(n, out))
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "@id" && typeof v === "string") out.push(v)
      else collectIds(v, out)
    }
  }
  return out
}

describe("schema ids", () => {
  it("are absolute www URLs", () => {
    const ids = [
      ...collectIds(siteGraphLd()),
      ...collectIds(softwareApplicationLd()),
      ...collectIds(humanPolishServiceLd()),
    ]
    assert.ok(ids.length > 0)
    for (const id of ids) assert.match(id, /^https:\/\/www\.renderspace\.ai\//)
  })

  it("reference the shared organization", () => {
    assert.deepEqual(softwareApplicationLd().publisher, { "@id": ORG_ID })
    assert.deepEqual(humanPolishServiceLd().provider, { "@id": ORG_ID })
    const graph = siteGraphLd()["@graph"]
    assert.equal(graph[0]["@id"], ORG_ID)
    assert.equal(graph[1]["@id"], WEBSITE_ID)
    assert.equal(softwareApplicationLd()["@id"], SOFTWARE_ID)
    assert.equal(humanPolishServiceLd()["@id"], HUMAN_POLISH_SERVICE_ID)
  })
})

describe("organization", () => {
  it("names the founder and Instagram profile", () => {
    const org = siteGraphLd()["@graph"][0] as Record<string, unknown>
    assert.deepEqual(org.founder, { "@type": "Person", name: "KeSean Fallon" })
    assert.deepEqual(org.sameAs, [...SITE.sameAs])
  })
})

describe("prices match their sources", () => {
  it("software offers equal PLANS", () => {
    const prices = softwareApplicationLd().offers.map((o) => o.price)
    assert.deepEqual(prices, [PLANS.starter.priceUsd, PLANS.professional.priceUsd, PLANS.business.priceUsd])
  })

  it("service offers equal lib/human-polish/config.ts", () => {
    const prices = humanPolishServiceLd().hasOfferCatalog.itemListElement.map((o) => o.price)
    const expected = [
      ...Object.values(AI_RENDER_PACK_STANDARD_PRICES_CENTS),
      ...Object.values(BUILD_READY_STANDARD_PRICES_CENTS),
    ].map((c) => c / 100)
    assert.deepEqual(prices, expected)
  })
})

describe("faq", () => {
  it("has unique ids and every item appears somewhere", () => {
    const ids = FAQ_ITEMS.map((i) => i.id)
    assert.equal(new Set(ids).size, ids.length)
    for (const item of FAQ_ITEMS) assert.ok(item.surfaces.length > 0, item.id)
  })

  it("FAQPage JSON-LD mirrors the /faq list", () => {
    const ld = faqPageLd(faqFor("faq"))
    assert.equal(ld.mainEntity.length, faqFor("faq").length)
  })

  it("quotes the current plan facts", () => {
    const credits = FAQ_ITEMS.find((i) => i.id === "credits")!
    assert.ok(credits.a.includes("500 credits per month"))
    assert.ok(credits.a.includes("6,000"))
  })
})

describe("output", () => {
  it("serializes without undefined values", () => {
    for (const data of [siteGraphLd(), softwareApplicationLd(), humanPolishServiceLd()]) {
      const json = JSON.stringify(data)
      assert.ok(!json.includes("undefined"))
      assert.ok(!json.includes("null"))
    }
  })

  it("formats money", () => {
    assert.equal(usd(19.99), "$19.99")
    assert.equal(usd(99), "$99")
    assert.equal(usd(1199), "$1,199")
  })
})
