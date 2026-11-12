import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MOST_POPULAR_PLAN, perRenderLabel } from "./catalog"
import { canUsePromoPreview } from "./promotions"
import { isStripeCouponId } from "./stripeCoupon"

describe("isStripeCouponId", () => {
  it("accepts custom and coupon_ ids", () => {
    assert.equal(isStripeCouponId("coupon_abc123"), true)
    assert.equal(isStripeCouponId("bf2026"), true)
    assert.equal(isStripeCouponId("BLACK-FRIDAY_2026"), true)
  })

  it("rejects prices, blanks, and junk", () => {
    assert.equal(isStripeCouponId("price_123"), false)
    assert.equal(isStripeCouponId("prod_123"), false)
    assert.equal(isStripeCouponId(""), false)
    assert.equal(isStripeCouponId("has space"), false)
    assert.equal(isStripeCouponId(null), false)
  })
})

describe("catalog helpers", () => {
  it("marks Professional as most popular and labels per-render cost", () => {
    assert.equal(MOST_POPULAR_PLAN, "professional")
    assert.match(perRenderLabel("intro"), /\$0\.50/)
    assert.match(perRenderLabel("professional"), /\$0\.20/)
    assert.match(perRenderLabel("business"), /¢/)
  })
})

describe("promo preview gate", () => {
  it("allows preview/dev and blocks production", () => {
    assert.equal(canUsePromoPreview({ vercelEnv: "preview" }), true)
    assert.equal(canUsePromoPreview({ vercelEnv: "development" }), true)
    assert.equal(canUsePromoPreview({ vercelEnv: "production" }), false)
    assert.equal(canUsePromoPreview({ vercelEnv: null, nodeEnv: "development" }), true)
    assert.equal(canUsePromoPreview({ vercelEnv: null, nodeEnv: "production" }), false)
  })
})
