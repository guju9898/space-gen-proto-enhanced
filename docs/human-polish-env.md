# Human Polish — Environment Variables

Server-only configuration for Human Polish V1. Never expose these to the browser
and never log their values.

## Supabase (existing)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (also used server-side). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for server API routes (draft/upload). Server-only. |

## Rate limiting (Upstash) — single shared database

Used by `lib/human-polish/rate-limit.ts` to enforce distributed rate limits on
the Human Polish guest endpoints (draft create/recover/submit, upload
sign/complete, and checkout initiation).

**One Upstash Redis database is intentionally shared** across Production,
Preview, and local Development (free-plan limit). Environments are isolated
with key prefixes — never by creating separate databases.

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint (shared). |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token. Server-only (shared). |
| `UPSTASH_RATELIMIT_PREFIX` | Environment namespace for rate-limit keys. |

### Expected `UPSTASH_RATELIMIT_PREFIX` values

| Environment | Value |
|---|---|
| Production | `hp:production` |
| Preview | `hp:preview` |
| Development | `hp:development` |

### Key structure

Each `@upstash/ratelimit` instance uses a prefix of:

```text
{UPSTASH_RATELIMIT_PREFIX}:human-polish:{feature}
```

Examples:

```text
hp:production:human-polish:draft-create
hp:production:human-polish:draft-recover
hp:production:human-polish:draft-submit
hp:production:human-polish:upload-sign
hp:production:human-polish:upload-complete
hp:production:human-polish:checkout
```

The rate-limit **identifier** is a SHA-256 hash of the client IP (truncated).
Raw IPs, emails, phones, names, auth tokens, and draft recovery tokens are
**never** stored in Redis keys or logged by the limiter.

### Prefix fallback when `UPSTASH_RATELIMIT_PREFIX` is unset

| Environment | Behavior |
|---|---|
| Production | **Fail closed** — controlled configuration error (HTTP 503). Never inferred from request headers. |
| Preview | Derive `hp:preview` when `VERCEL_ENV === "preview"`. |
| Development | Derive `hp:development`. |

### Credentials / fallback behavior

- **Production:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and
  `UPSTASH_RATELIMIT_PREFIX` are **required**. No in-memory fallback. Missing
  config returns a controlled 503 from Human Polish routes.
- **Preview:** Use Upstash when credentials are set. If absent, a documented
  in-memory fallback is permitted (non-distributed; Preview-only convenience).
- **Development:** In-memory fallback when Upstash is not configured
  (per-process only).
- **Upstash runtime errors** (credentials set but Redis fails): always **fail
  closed** (deny with a short retry) so an outage cannot silently disable limits.

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

## Application URL resolution — release hardening

Used by `lib/human-polish/app-url.ts` for Stripe success/cancel URLs, draft
recovery links in email, and other server-built absolute Human Polish links.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | **Preferred** public origin (e.g. `https://renderspace.ai`). |
| `NEXT_PUBLIC_DOMAIN` | Fallback origin or bare hostname (normalized to `https://…`). |

Resolution priority (server-side, trailing slashes stripped):

1. `NEXT_PUBLIC_APP_URL`
2. `NEXT_PUBLIC_DOMAIN`
3. Trusted request `Origin` header (browser same-origin calls only — not
   `X-Forwarded-Host` / `X-Forwarded-Proto`)
4. `http://localhost:3000` **only** when `NODE_ENV !== "production"`

Rules:

- Production env-configured URLs **must** use HTTPS; http values are rejected.
- Absolute redirect targets are never accepted from the client. Callers append
  fixed relative paths such as `/human-polish/success?session_id=…`.
- Do not rename or remove either variable; keep both for compatibility.

Notes:

- Amounts are **server-authoritative** and come exclusively from
  `lib/human-polish/config.ts`. The browser never supplies price, discount, rush
  approval, or tax.
- Discounts never stack: the checkout applies the single best eligible offer
  (standard vs. first-purchase 25-pack vs. 15% subscriber) per spec §2.1/§5.
- The first-purchase promo is verified server-side against paid history for the
  normalized phone; the subscriber discount requires an authenticated active
  Professional/Business session.

## Draft expiration — inactivity window

`draft_expires_at` is a **15-minute inactivity** window, not a timer from draft
creation. Successful authenticated recover / submit / upload-sign / upload-complete
(and checkout initiation) extend the window server-side. Invalid, expired, or
rate-limited requests never refresh it. Clients cannot supply an expiration.

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

## Transactional email (Loops) — added by the Human Polish email agent

`lib/human-polish/email.ts` sends the §6.2 milestone emails through the Loops
transactional API, mirroring the fetch/auth conventions of the existing
`lib/loops.ts` integration. It adds no npm packages.

### Shared Loops variables (existing)

| Variable | Purpose |
|---|---|
| `LOOPS_API_KEY` | Loops API key. When **absent**, all Human Polish email functions are safe no-ops (no network call, no throw) — this is expected in build/CI and any environment without the key. Server-only; never logged. |
| `LOOPS_API_BASE_URL` | Optional Loops API base URL override. Defaults to `https://app.loops.so/api/v1`. |

### Human Polish internal alert recipient

| Variable | Purpose |
|---|---|
| `LOOPS_HP_INTERNAL_ALERT_EMAIL` | Optional override for the internal team alert recipient. Defaults to `frank@renderspace.ai` (spec §6.2). |

### Human Polish transactional template IDs

Each §6.2 milestone maps to one Loops transactional template. **The template IDs
must be provisioned by a human in the Loops dashboard.** Until the matching env
var is set, the send is a guarded no-op (a `TODO_` placeholder id is used and no
email is sent). All are server-only and never logged.

| Variable | §6.2 event | Sending function |
|---|---|---|
| `LOOPS_HP_DRAFT_RECEIVED_TEMPLATE_ID` | #1 Draft/intake received | `sendDraftReceivedEmail` |
| `LOOPS_HP_PAYMENT_RECEIVED_TEMPLATE_ID` | #2 Payment received | `sendPaymentReceivedEmail` |
| `LOOPS_HP_FILES_NEED_INFO_TEMPLATE_ID` | #3 Files need replacement/more info | `sendFilesNeedInfoEmail` |
| `LOOPS_HP_FILES_ACCEPTED_TEMPLATE_ID` | #4 Files accepted / clock started | `sendFilesAcceptedEmail` |
| `LOOPS_HP_RUSH_APPROVED_TEMPLATE_ID` | #5 Rush request approved | `sendRushApprovedEmail` |
| `LOOPS_HP_RUSH_UNAVAILABLE_TEMPLATE_ID` | #6 Rush not available (standard option) | `sendRushUnavailableEmail` |
| `LOOPS_HP_FIRST_BATCH_READY_TEMPLATE_ID` | #7 First batch ready | `sendFirstBatchReadyEmail` |
| `LOOPS_HP_FINAL_DELIVERY_READY_TEMPLATE_ID` | #8 Final delivery ready | `sendFinalDeliveryReadyEmail` |
| `LOOPS_HP_BUILD_READY_SCOPE_APPROVED_TEMPLATE_ID` | #9 Build-Ready scope approved | `sendBuildReadyScopeApprovedEmail` |
| `LOOPS_HP_BUILD_READY_QUOTE_TEMPLATE_ID` | #10 Build-Ready custom quote / more info | `sendBuildReadyQuoteEmail` |
| `LOOPS_HP_BUILD_READY_PAYMENT_REQUESTED_TEMPLATE_ID` | #11 Build-Ready payment requested | `sendBuildReadyPaymentRequestedEmail` |
| `LOOPS_HP_REVISION_REQUEST_RECEIVED_TEMPLATE_ID` | #12 Revision request received | `sendRevisionRequestReceivedEmail` |
| `LOOPS_HP_FINAL_COMPLETION_TEMPLATE_ID` | #13 Final completion | `sendFinalCompletionEmail` |
| `LOOPS_HP_RIGHTS_PERMISSION_REQUEST_TEMPLATE_ID` | #14 Rights/case-study permission request | `sendRightsPermissionRequestEmail` |
| `LOOPS_HP_PACK_EXPIRATION_REMINDER_TEMPLATE_ID` | #15 Pack expiration reminder | `sendPackExpirationReminderEmail` |
| `LOOPS_HP_INTERNAL_ALERT_TEMPLATE_ID` | Internal team alert | `sendInternalTeamAlertEmail` |

### Loops dashboard setup (manual)

1. In Loops, create one **transactional** email template per row above. Add the
   `dataVariables` each template needs (see the param interfaces in
   `lib/human-polish/email.ts`; e.g. `contactName`, `requestId`, `package`,
   `serviceFamily`, `recoveryUrl`, `amount`, `deliveryTarget`, `downloadUrl`, etc.).
2. Copy each template's transactional id and set the matching `LOOPS_HP_*_TEMPLATE_ID`
   env var in the deployment environment (and `.env.local` for local testing).
3. Confirm `LOOPS_API_KEY` is present in the environment where emails should send.
4. Confirm none of these are prefixed with `NEXT_PUBLIC_` (they must stay server-only).
5. Until a template id is set, that milestone email is silently skipped (guarded
   no-op) — safe to deploy incrementally.

## Manual setup checklist

1. Create an Upstash Redis database (one shared DB is intentional).
2. Add `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and
   `UPSTASH_RATELIMIT_PREFIX` to each deployment environment
   (`hp:production` / `hp:preview` / `hp:development`).
3. Confirm these are **not** prefixed with `NEXT_PUBLIC_` (they must stay server-only).
4. Add `STRIPE_HP_WEBHOOK_SECRET` (and optionally `STRIPE_HP_TAX_CODE`) to the
   deployment environment. `STRIPE_SECRET_KEY` is shared with the existing
   subscription integration. Set `NEXT_PUBLIC_APP_URL` (preferred) or
   `NEXT_PUBLIC_DOMAIN` so Stripe success/cancel and email recovery links resolve
   correctly in production.
