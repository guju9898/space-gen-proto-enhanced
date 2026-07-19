# Human Polish — Environment Variables

Server-only configuration for Human Polish V1. Never expose these to the browser
and never log their values.

## Supabase (existing)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (also used server-side). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for server API routes (draft/upload). Server-only. |

## Rate limiting (Upstash) — added by platform hardening

Used by `lib/human-polish/rate-limit.ts` to enforce distributed rate limits on
the Human Polish guest endpoints (draft create/recover, upload sign/complete,
and later checkout initiation).

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token. Server-only. |

Behavior:

- **Production:** when both variables are set, an Upstash sliding-window limiter
  is used across all serverless instances. If Upstash is configured but a request
  errors, the limiter **fails closed** (denies with a short retry) so an outage
  cannot silently disable rate limiting.
- **Local development:** when the variables are absent, a controlled in-memory
  fallback is used. It is **not distributed** (per-process only) and must not be
  relied upon in production.

## Phone normalization — added by platform hardening

`lib/human-polish/phone.ts` uses `libphonenumber-js` for E.164 normalization.
No environment variables are required. The default country is `US` and is applied
only when the input has no explicit country code.

## Stripe — Human Polish one-time payments

Used by `lib/human-polish/stripe.ts`, `app/api/human-polish/checkout/route.ts`, and
`app/api/human-polish/webhook/route.ts` for the one-time (`mode: "payment"`)
Human Polish checkout. These are **independent** from the subscription Stripe
integration and must never mutate subscription state.

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Shared Stripe secret key (same key as the subscription integration). Server-only. |
| `STRIPE_HP_WEBHOOK_SECRET` | Signing secret for the **dedicated** Human Polish webhook endpoint (`/api/human-polish/webhook`). Distinct from `STRIPE_WEBHOOK_SECRET`. Server-only. |
| `STRIPE_HP_TAX_CODE` | Optional. Stripe Tax product tax code applied to Human Polish line items. Defaults to `txcd_20030000` (general services). |
| `NEXT_PUBLIC_APP_URL` | Fallback origin for Stripe success/cancel URLs when no `Origin` header is present. |

Notes:

- Amounts are **server-authoritative** and come exclusively from
  `lib/human-polish/config.ts`. The browser never supplies price, discount, rush
  approval, or tax.
- Discounts never stack: the checkout applies the single best eligible offer
  (standard vs. first-purchase 25-pack vs. 15% subscriber) per spec §2.1/§5.
- The first-purchase promo is verified server-side against paid history for the
  normalized phone; the subscriber discount requires an authenticated active
  Professional/Business session.

## Manual Stripe dashboard setup (Human Polish)

1. **Stripe Tax:** enable Stripe Tax (Settings → Tax) and configure an origin
   address and registrations. The checkout sets `automatic_tax: { enabled: true }`
   with tax-exclusive line items, so tax is added on top of the displayed price.
2. **Webhook endpoint:** create a webhook (Developers → Webhooks) pointing at
   `https://<your-domain>/api/human-polish/webhook`. Subscribe to:
   `checkout.session.completed`, `payment_intent.succeeded`, and
   `payment_intent.payment_failed`. Copy the endpoint's signing secret into
   `STRIPE_HP_WEBHOOK_SECRET`.
3. **Test mode first:** complete a full test order (spec §14) before enabling live
   prices.

## Manual setup checklist

1. Create an Upstash Redis database.
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the deployment
   environment (and to `.env.local` for local testing of distributed limits).
3. Confirm these are **not** prefixed with `NEXT_PUBLIC_` (they must stay server-only).
4. Add `STRIPE_HP_WEBHOOK_SECRET` (and optionally `STRIPE_HP_TAX_CODE`) to the
   deployment environment. `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_APP_URL` are shared
   with the existing integration.
