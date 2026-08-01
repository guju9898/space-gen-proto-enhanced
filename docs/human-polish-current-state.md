# Human Polish™ V1 — Current State

> ⚠️ Canonical product rules live in `docs/human-polish-v1-spec.md`. This file is a
> point-in-time state snapshot, not a source of truth for business rules.
> Do not edit the canonical specification based on this document.

- **Last audit / update date:** 2026-07-24
- **Integration branch (base):** `feat/human-polish-v1` @ `995e63b` (tag `human-polish-wave2-integrated`)
- **Release-hardening branch:** `hp/release-hardening` (this work — not merged)

## Implemented Features

- Public marketing page `/human-polish` (static) with spec-accurate pricing/copy.
- Guest intake wizard `/human-polish/intake` (static): draft creation, draft recovery,
  private signed uploads, submit/finalization with server-side phone normalization
  and acknowledgment enforcement.
- Post-checkout `/human-polish/success` (dynamic, server-verified against the HP request).
- AI Render Pack one-time Stripe Checkout via server-generated `price_data`
  (first-purchase-by-phone, subscriber 15%, non-stacking, server-side rush pricing).
- Build-Ready flow submits for human review before payment (no direct checkout).
- Dedicated Human Polish Stripe webhook (`mode==="payment"` + `productType==="human_polish"`,
  idempotent paid transition, count-guarded payment emails). Subscription webhook unchanged.
- Loops transactional email helpers (best-effort, no rollback) + internal alerts.
- Navigation link `Human Polish™ → /human-polish` in public + authenticated app nav.

## Release-hardening completed on this branch

- **Inactivity-based draft expiration:** `draft_expires_at` resets to now + 15 minutes
  after every successful authenticated recover, submit, upload-sign, upload-complete,
  and checkout initiation. Invalid / expired / rate-limited requests never refresh.
  Expired drafts return HTTP 410 with `code: "draft_expired"`.
- **Server-safe URL resolution:** `lib/human-polish/app-url.ts` resolves
  `NEXT_PUBLIC_APP_URL` → `NEXT_PUBLIC_DOMAIN` → trusted `Origin` → local-dev
  fallback (non-production only). Used for Stripe success/cancel URLs and email
  recovery links. Fixed relative paths only (no open redirects). Documented in
  `docs/human-polish-env.md`.

## Data & Storage (Supabase)

- Tables `human_polish_requests` and `human_polish_files`, RLS on, owner-only SELECT
  policies, service-role writes. Live schema matches
  `supabase/migrations/20260716150000_human_polish_foundation.sql`.
- Private bucket `human-polish-uploads` (25 MB, JPEG/PNG/PDF, no anon policies).
- NOTE: migration was applied via SQL editor; not registered in Supabase migration history.

## External Services — still required for release

| Service | Status |
|---|---|
| Supabase (schema + private bucket) | Applied / verified |
| Stripe account | Connected; Tax origin address still required before live automatic tax |
| Stripe HP webhook (`/api/human-polish/webhook`) | Must be verified/registered in dashboard (test + live) |
| Upstash Redis | Code-ready; env vars required for production distributed limits |
| Loops templates + API key | Code-ready; template IDs must be provisioned |

## Environment Variable Names (no values)

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_HP_WEBHOOK_SECRET`, `STRIPE_HP_TAX_CODE` (optional)
- Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Loops: `LOOPS_API_KEY`, `LOOPS_HP_*_TEMPLATE_ID` (see `docs/human-polish-env.md`), `LOOPS_HP_INTERNAL_ALERT_EMAIL` (optional)
- URL: `NEXT_PUBLIC_APP_URL` (preferred), `NEXT_PUBLIC_DOMAIN` (fallback)

## Completed Milestones

- Wave 1 (Foundation, Marketing, Navigation) integrated.
- Wave 2 (Platform Hardening, Intake, Stripe, Email) integrated + end-to-end wiring.
- Release hardening: inactivity draft TTL + URL resolution helper (this branch).

## Still Pending / Separate

- Full runtime draft → upload → submit → checkout → webhook test (not yet executed).
- Subscription checkout runtime regression test.
- Stripe Tax origin / head-office configuration (live).
- WhatsApp assisted-sales deep-link (interim mailto placeholder remains).
- **Admin dashboard** — separate branch / wave; not started on this branch.
- Customer-facing order portal — deferred by V1 design.
- Vercel Preview and production deployment — not part of this branch.

## MCP housekeeping note

`.cursor/mcp.json` (main checkout) contains only project-level MCP URLs (Supabase
project ref query param + Stripe MCP URL) and **no secrets**. It is safe to commit
as shared project config **with owner approval**; this branch does not commit it.
