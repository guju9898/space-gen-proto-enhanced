# Human Polish™ V1 — Current State

> ⚠️ Canonical product rules live in `docs/human-polish-v1-spec.md`. This file is a
> point-in-time state snapshot, not a source of truth for business rules.
> Do not edit the canonical specification based on this document.

- **Last audit / update date:** 2026-08-10
- **Integration branch:** `enhanced-studio-ui` @ `bc4a6b3` (+ local Phase 8B work)
- **Production lineage:** Phase 7B Build-Ready revenue workflow live on `www.renderspace.ai`

## Implemented Features (through Phase 8B code)

- Public marketing page `/human-polish` with GA events (typed, non-PII).
- Guest intake wizard `/human-polish/intake` (draft, recovery, private uploads, submit).
- AI Render Pack Stripe Checkout + Build-Ready approve → payment request → Checkout.
- Dedicated Human Polish Stripe webhook (idempotent paid transition; does not mutate subscriptions).
- Post-checkout `/human-polish/success` (server-verified) with `completed_checkout` + promotion-applied analytics.
- Checkout cancel analytics via safe query flags (AI marketing + BR pay page).
- Admin dashboard: ops actions, Build-Ready panel, rights panel, Copy project summary.
- Portfolio rights workflow: Admin request → Loops email → `/human-polish/rights/[requestId]` Allow/Decline.
- AI pack `paid_at` + `pack_expires_at` (90 days from purchase) + daily cron reminder path.
- Loops transactional helpers for all V1 milestones (template IDs provisioned per env).

## Phase progress

| Phase | Status |
|---|---|
| 1 Admin access/security | Live |
| 2 Production Loops (core path) | Live |
| 3 Stripe hardening | Live |
| 4 Upstash | Live |
| 5 Supabase Storage/RLS | Live |
| 6 AI Render Pack operations | Live |
| 7 Build-Ready revenue | Live (unpaid QA passed through Checkout boundary) |
| 8 Analytics / rights / expiration / summary | **Code + migration ready — not yet Production-applied** |
| 9 Controlled-live-launch gate | Pending first genuine paid orders + Phase 8C Loops/env |

## Controlled-live-launch override (owner decision)

Canonical `docs/human-polish-v1-spec.md` §14 still lists:

> A complete test order succeeds in Stripe test mode before production prices are enabled.

**Owner override:** Human Polish uses a controlled live-launch strategy without a
separate Stripe test-mode setup for V1. Live Checkout is used carefully with
internal QA stopping before payment completion where required. This conflict is
documented here intentionally — **do not silently rewrite the canonical spec**.

## Data & Storage (Supabase)

- Tables `human_polish_requests` / `human_polish_files`, RLS on, private bucket
  `human-polish-uploads` (Phase 5 hardened).
- Phase 8B migration (local, not applied): rights status/token fields + `paid_at` /
  `pack_expires_at` / `expiration_reminder_sent_at`.

## Environment Variable Names (no values)

See `docs/human-polish-env.md` for the full map, including:

- `CRON_SECRET`
- `LOOPS_HP_RIGHTS_PERMISSION_REQUEST_TEMPLATE_ID`
- `LOOPS_HP_PACK_EXPIRATION_REMINDER_TEMPLATE_ID`

## Still pending before Phase 9

- Apply Phase 8B Production SQL (owner).
- Publish/configure Loops #14 Rights + #15 Pack Expiration (+ Final Completion CTA polish).
- Set Vercel Production/Preview: rights + expiration template IDs + `CRON_SECRET`.
- Commit / promote Phase 8B application code.
- First genuine paid AI / Build-Ready orders for webhook, delivery, rights, and reminder E2E.

## Intentionally outside / deferred

- Concepts-used ledger / automatic pack forfeiture.
- Trello/Asana API sync (Copy project summary only).
- Customer order portal.
- Automatic subscription Checkout from Human Polish completion.
