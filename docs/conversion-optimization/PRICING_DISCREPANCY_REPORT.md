# Pricing discrepancy report

Audit date: 2026-10-20. Stripe prices were retrieved read-only. No live Stripe resource was created or changed. Existing subscribers were not migrated.

## Verified Stripe prices

| Plan | Env var | Interval | Amount | Product |
| --- | --- | --- | --- | --- |
| Intro | `STRIPE_PRICE_INTRO_WEEKLY` (same value as `NEXT_PUBLIC_STRIPE_PRICE_INTRO`) | week, count 1 | $19.99 | Renderspace Intro Plan |
| Professional | `STRIPE_PRICE_PRO_MONTHLY` (same value as `NEXT_PUBLIC_STRIPE_PRICE_PRO`) | month | $98.00 | Professional |
| Business | `STRIPE_PRICE_BUSINESS_MONTHLY` (same value as `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS`) | month | $349.00 | Business Plan |

The intro price is a recurring weekly subscription. It has no `trial_period_days`. Checkout already used `mode: "subscription"`.

`NEXT_PUBLIC_STRIPE_PRICE_PERSONAL` points at a price Stripe does not recognize. Application checkout does not use it.

`STRIPE_PRICE_PRO_ANNUAL` and `STRIPE_PRICE_BUSINESS_ANNUAL` are unset.

## What the app was showing

| Surface | Before this change | Charged amount |
| --- | --- | --- |
| `lib/seo/facts.ts` Professional | $99 / month | $98 / month |
| Homepage and `/pricing` Professional | $99 | $98 |
| Homepage and `/pricing` intro | “40 credits • 7 days” and “Automatically upgrades to Professional” | $19.99 every week |
| `components/marketing/IntroModal.tsx` | “7 days” and “renews into Professional at $99/month” | $19.99 every week |
| Onboarding intro card | “/ 7 days”, “7-day trial”, “Rolls into Professional” | weekly price |
| Onboarding Professional | $98 | $98 (already matched) |
| Contractor demo | $98 and $349 | matched, but hardcoded |
| Account billing | Intro labeled “Intro Trial”; every plan labeled Monthly | intro is weekly |
| `components/payment/SubscriptionDisclaimer.tsx` | “Space Gen” | Renderspace |
| `components/RoiCalculator.tsx` | Professional $99 | $98 |
| Blog posts under `content/blog/` | $99 and “7 days” in several articles | not rewritten in this change |
| Human Polish | first 25-pack $349, subscriber 15% off, no stacking | unchanged |

The webhook, after a new intro checkout, created a subscription schedule that moved the customer to Professional after one week. Public copy called that a 7-day non-recurring trial and quoted the Professional upgrade at $99. Both the price and the “non-recurring” description were wrong. New checkouts no longer create that schedule unless `INTRO_ROLLS_INTO_PROFESSIONAL=true`. Schedules already created are left in place.

## Canonical configuration

`lib/pricing/catalog.ts` is the amount source. `lib/seo/facts.ts` `PLANS` is derived from it. Checkout resolves a Price ID only through `lib/stripe/plans.ts`.

Intro credits refresh on `invoice.payment_succeeded` when `billing_reason` is `subscription_cycle` and the invoice price is the intro price. A webhook retry does not reset `credits_used` if that `period_start` row already exists. The first invoice stays on `checkout.session.completed`.

## Annual plans (not for sale)

Proposed 20% savings, not approved and not displayed as a purchasable price:

| Plan | Twelve monthly payments | Proposed annual charge |
| --- | --- | --- |
| Professional | $1,176.00 | $940.80 |
| Business | $4,188.00 | $3,350.40 |

Create recurring yearly USD Prices, then set:

- `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_BUSINESS_ANNUAL`

`GET /api/pricing/offers` returns an annual amount only after Stripe confirms an active yearly price. Until then the Annual control stays disabled and checkout returns 409 for `interval=year`.

## Promotions

`lib/pricing/promotions.ts` defines two disabled candidates:

- `candidate-initial-20`: 20% off the first Professional or Business monthly invoice, 2026-11-01 through 2026-11-08 UTC, max 100.
- `candidate-annual-signup`: 15% off the first annual invoice, 2026-11-01 through 2026-11-15 UTC, max 50.

Neither has a coupon env var. Checkout ignores an ineligible `promotionId` and still creates a full-price session. A coupon is attached only when the campaign is enabled, inside its window, matches the plan and interval, is under the redemption cap, is not combined with Human Polish or an affiliate code, is not `forever`, and the server env named by `stripeCouponEnv` is a `coupon_` id. The client cannot send a coupon id.

Human Polish first-purchase and subscriber discounts are unchanged and still cannot stack with each other. Subscription campaigns cannot apply on the Human Polish surface.

## Still outstanding

- Blog markdown listed above still says $99 and “7 days”.
- Customers who already have an intro-to-Professional schedule will still move to Professional. This change does not cancel those schedules.
- A second intro purchase stays blocked by `intro_offer_claims`.
- Redemption counts passed to checkout are 0 until a redemption table exists. Disabled campaigns cannot redeem, so the missing table does not grant a discount.
