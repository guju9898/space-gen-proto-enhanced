# Human Polish™ — Final Release Checklist (V1)

**Deployment branch:** `enhanced-studio-ui`  
**Canonical spec:** `docs/human-polish-v1-spec.md`  
**Env reference:** `docs/human-polish-env.md`  
**Ops SOP:** `docs/human-polish-operations-sop.md`  
**Admin QA:** `docs/human-polish-admin-qa-plan.md`  
**Loops pack:** `docs/human-polish-loops-template-pack.md`

### Legend

| Tag | Meaning |
|---|---|
| **P** | Required before Preview QA |
| **G** | Required before Production (Go-live) |
| **A** | Safe to complete After launch (tracked) |

Mark each row: `[ ]` / `[x]` and note owner + date.

---

## A. Code and Git

| # | Item | Tag | Done |
|---|---|---|---|
| A1 | All approved feature branches merged into `enhanced-studio-ui` (intake, Stripe, email, hardening, Admin, ops docs as needed) | P | |
| A2 | Production build succeeds (`next build` / CI) | P | |
| A3 | Typecheck / lint clean on merge commit | P | |
| A4 | Clean working tree on release commit | G | |
| A5 | Deployment commit identified; optional release tag | G | |
| A6 | Backup branch / tag retained (e.g. pre-HP-admin backup pattern) | G | |
| A7 | No secrets in git; `.env*` not committed | G | |

---

## B. Vercel

| # | Item | Tag | Done |
|---|---|---|---|
| B1 | Human Polish routes deployed on Preview: `/human-polish`, intake, success, APIs | P | |
| B2 | Correct deployment branch = `enhanced-studio-ui` (or approved release branch) | G | |
| B3 | Production env vars set per `docs/human-polish-env.md` | G | |
| B4 | Preview env vars set (test Stripe, Preview Upstash prefix, Loops) | P | |
| B5 | **No** Stripe test key in Production | G | |
| B6 | **No** Stripe live key in Preview | P | |
| B7 | `UPSTASH_RATELIMIT_PREFIX`: Production `hp:production`; Preview `hp:preview` | G | |
| B8 | `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_DOMAIN` correct per environment | G | |
| B9 | Admin allowlist env configured for Production (**OWNER DECISION** exact var name from Admin) | G | |
| B10 | Admin routes protected on Production deploy | G | |

---

## C. Stripe

| # | Item | Tag | Done |
|---|---|---|---|
| C1 | Human Polish **live** webhook → `/api/human-polish/webhook` | G | |
| C2 | Human Polish **test** webhook → Preview/test URL | P | |
| C3 | Webhook deliveries return direct **2xx** (no long async stall) | P/G | |
| C4 | Separate signing secrets: `STRIPE_HP_WEBHOOK_SECRET` ≠ subscription `STRIPE_WEBHOOK_SECRET` | G | |
| C5 | Events subscribed: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed` | P/G | |
| C6 | Stripe Tax enabled; origin address / registrations configured for live | G | |
| C7 | Full sandbox transaction (AI Render Pack) | P | |
| C8 | Live smoke test (small real payment or approved live test) | G | |
| C9 | Subscription webhook health unchanged after HP launch | G | |
| C10 | Optional `STRIPE_HP_TAX_CODE` reviewed | A | |

---

## D. Supabase

| # | Item | Tag | Done |
|---|---|---|---|
| D1 | Tables `human_polish_requests`, `human_polish_files` present | P | |
| D2 | RLS enabled; no anonymous public reads | P | |
| D3 | Private bucket `human-polish-uploads`; `public=false` | P | |
| D4 | No public storage policies for HP bucket | P | |
| D5 | Real/synthetic test request created end-to-end | P | |
| D6 | File metadata rows match uploads | P | |
| D7 | Paid status updates via webhook | P | |
| D8 | Admin access uses authorized server path (service role never in browser) | G | |

---

## E. Upstash

| # | Item | Tag | Done |
|---|---|---|---|
| E1 | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set | P/G | |
| E2 | Preview prefix `hp:preview` (or derived) | P | |
| E3 | Production prefix `hp:production` **required** (fail closed if missing) | G | |
| E4 | Development prefix `hp:development` for local | A | |
| E5 | Keys contain hashed identifiers only — **no raw PII** | P | |
| E6 | Preview traffic visible in Upstash metrics when enabled | P | |
| E7 | Production does **not** silently fall back to in-memory | G | |

---

## F. Loops

| # | Item | Tag | Done |
|---|---|---|---|
| F1 | `LOOPS_API_KEY` in Preview | P | |
| F2 | `LOOPS_API_KEY` in Production | G | |
| F3 | Template IDs for wired emails: draft, payment, internal alert | P | |
| F4 | Remaining milestone template IDs provisioned before Admin ops go live | G | |
| F5 | Customer emails verified in Preview (content + variables) | P | |
| F6 | Internal alerts to `frank@renderspace.ai` (or override) | P | |
| F7 | Email failure does not roll back payment/status | P | |
| F8 | No duplicate payment email on webhook retry | P | |
| F9 | Expiration reminder scheduler | A | |

---

## G. Admin

| # | Item | Tag | Done |
|---|---|---|---|
| G1 | Authorization matrix passed (`docs/human-polish-admin-qa-plan.md` AUTH-*) | G | |
| G2 | Request list: search, filter, pagination, masked PII | G | |
| G3 | File review + signed downloads | G | |
| G4 | Status actions + invalid transition rejection | G | |
| G5 | Signed files: expiry + cross-request denial | G | |
| G6 | Assignment + delivery tracking timestamps | G | |
| G7 | Email actions / milestone sends | G | |
| G8 | Ops SOP training for Frank / PM | A | |

---

## H. Full runtime tests

| # | Item | Tag | Done |
|---|---|---|---|
| H1 | First purchase 25-pack phone eligibility | P | |
| H2 | Repeat phone denied first-purchase promo | P | |
| H3 | Subscriber 15% (authenticated Professional/Business) | P | |
| H4 | No discount stacking | P | |
| H5 | Rush request → approve/reject paths | P | |
| H6 | Build-Ready review-first (no direct unpaid production) | P | |
| H7 | Duplicate webhook idempotent | P | |
| H8 | Cancelled Checkout retains draft / follow-up possible | P | |
| H9 | Invalid/expired draft returns controlled error (410) | P | |
| H10 | Subscription regression smoke | G | |

---

## I. Launch-day monitoring

| # | Item | Tag | Done |
|---|---|---|---|
| I1 | Vercel logs watched for HP API 5xx | G | |
| I2 | Stripe webhook delivery log (HP endpoint) | G | |
| I3 | Supabase errors / storage failures | G | |
| I4 | Upstash usage / deny spikes | G | |
| I5 | Loops delivery / bounce | G | |
| I6 | Customer support inbox (`frank@renderspace.ai`) staffed | G | |
| I7 | Rollback criteria agreed (below) | G | |

### Rollback criteria (examples)

Trigger rollback discussion if within launch window:

- Checkout or webhook systematically failing for paid customers  
- Private files publicly listable / permanent public URLs discovered  
- Subscription state mutated by HP webhook  
- Admin authorization bypass  
- Widespread duplicate charges or duplicate payment emails  

---

## J. Rollback

| # | Item | Tag | Done |
|---|---|---|---|
| J1 | Restore previous known-good branch/tag on Vercel | G (prep) | |
| J2 | Disable / hide Human Polish CTAs in nav & marketing if needed | G (prep) | |
| J3 | **Preserve** existing paid requests — do not delete rows | G | |
| J4 | Keep HP webhook handling paid events or document manual reconciliation | G | |
| J5 | Customer communication template ready (delay / manual ops) | G | |
| J6 | **Do not** delete private files or payment history | G | |
| J7 | Postmortem + re-open checklist | A | |

---

## Go / No-Go

| Gate | Required sections | Decision |
|---|---|---|
| Preview QA start | All **P** items | |
| Production launch | All **G** items + Admin QA sign-off | |
| Post-launch backlog | **A** items | |

**Production launch approver:** ______________________ Date: __________

---

## Quick contradictions / watchouts (ops)

1. Spec §5.2 historically said “extend the existing Stripe webhook”; implementation uses a **dedicated** HP webhook + `STRIPE_HP_WEBHOOK_SECRET` — follow **implementation + env docs** for release.  
2. Current-state doc may lag Admin/email readiness — prefer code + `human-polish-env.md` over outdated snapshots.  
3. Internal alert Loops variables are limited (`subject`, `requestId`, `summary`, `adminUrl`); put PM detail in `summary` or Admin UI until code is extended.
