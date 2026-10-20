# Renderspace conversion optimization — master specification

**Status:** Group 0 design and engineering contract.  
**Branch:** `feat/conversion-design-foundation` (docs only).  
**Base:** `origin/enhanced-studio-ui` at `fca2e57`.  
**Audience:** Cloud Agents in Groups 1–7.

This document is the only design and integration contract for the conversion project. Do not invent a second visual system. Do not copy another product’s identity. Preserve the shipping Renderspace experience.

Verified against the repository on 2026-10-20. Paths below exist unless marked as a future contract (those paths do not exist yet; the owning group creates them).

---

## 1. Brand and design principles

Renderspace is a dark, premium visualization product for contractors and design/build businesses. The brand already in production is:

- Wordmark **Renderspace** in white, next to `/amethyst-flow.png` (`components/site/SiteHeader.tsx`, `lib/seo/facts.ts` `SITE.logoPath`).
- Default theme **dark** (`app/layout.tsx` `ThemeProvider defaultTheme="dark"`).
- Accent purple `#9747ff` / `#8608fd`, with the marketing header CTA using `from-orange-500 to-violet-700`.
- Body typeface **Inter** via `next/font/google` on `<body>` (`app/layout.tsx`).
- Canonical public origin **`https://www.renderspace.ai`**. Apex `renderspace.ai` 308-redirects to www (`middleware.ts`).

Principles for every conversion surface:

1. Extend existing pages. Do not replace navigation, Studio, or checkout flows.
2. Reuse `components/ui/*` and marketing shells before adding a new primitive.
3. Prices, credit counts, licenses, and proof numbers come from existing config modules. Do not hard-code a second price.
4. Do not invent testimonials, ROI, “most popular” counts, countdown timers, or stock scarcity.
5. Do not change Stripe price IDs, auth, credit enforcement rules, or generation prompts as part of conversion UI work.

---

## 2. Design tokens — canonical sources

There is no separate token package. Tokens live in Tailwind plus CSS variables.

| Token | Canonical source | Production value |
| --- | --- | --- |
| Tailwind theme | `tailwind.config.ts` | `darkMode: ["class"]`; content globs `app/`, `components/`, `pages/` |
| CSS variables | `app/globals.css` (`:root` and `.dark`) | Imported by `app/layout.tsx`. **This file wins.** |
| Legacy CSS | `styles/globals.css` | Not imported by the App Router layout. Do not treat it as canonical. It sets `font-family: Arial`. |
| Background (Tailwind color) | `tailwind.config.ts` `colors.background` | `#101010` |
| Primary (Tailwind color) | `tailwind.config.ts` `colors.primary.DEFAULT` | `#9747ff` |
| Muted foreground (Tailwind) | `tailwind.config.ts` `colors.muted.foreground` | `#8c8c8c` |
| Primary (HSL var) | `app/globals.css` `--primary` | `272 100% 64%` (light and dark) |
| Dark background var | `app/globals.css` `.dark --background` | `240 10% 4%` |
| Dark card / popover | `.dark --card`, `--popover` | `240 10% 4%` |
| Dark muted | `.dark --muted` | `240 3.7% 15.9%` |
| Dark border / input | `.dark --border`, `--input` | `240 3.7% 15.9%` |
| Ring (dark) | `.dark --ring` | `272 100% 64%` |
| Destructive (dark) | `.dark --destructive` | `0 62.8% 30.6%` |
| Radius | `--radius` | `0.5rem`; Tailwind `lg/md/sm` derive from it |
| Marketing surfaces (repeated literals) | page components | `#0a0a0a`, `#0a0d14`, `#0d1119`, `#1a1a1a`, `#343434` |
| Header CTA gradient | `components/site/SiteHeader.tsx` | `bg-gradient-to-r from-orange-500 to-violet-700` |
| Login primary gradient | `components/auth/LoginModal.tsx` | `from-[#9747ff] to-[#8608fd]` |
| Studio render button | `components/Studio/RenderButton.tsx` | `from-primary via-purple-600 to-indigo-600` |
| Font | `app/layout.tsx` | Inter, `subsets: ["latin"]` |
| Shadows | component classes | `shadow-sm` on `Card`; `shadow-md` on `RenderButton`. No custom shadow scale. |
| Motion | `tailwind.config.ts` | accordion 0.2s; `.animate-fade-in` 0.3s in `app/globals.css` |
| Plugins | `tailwind.config.ts` | `tailwindcss-animate`, `@tailwindcss/typography` |
| Class merge | `lib/utils.ts` `cn()` | `clsx` + `tailwind-merge` |

**Breakpoints** are Tailwind defaults (not overridden), plus:

- Marketing nav switches at **`lg`** (`hidden lg:flex` in `SiteHeader`).
- `components/ui/use-mobile.tsx` treats width **&lt; 768** as mobile (`MOBILE_BREAKPOINT = 768`).
- Container padding `2rem`; `2xl` screen `1400px` (`tailwind.config.ts` `theme.container`).

Do not add a parallel color palette. If a conversion module needs a token, consume `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, or the existing hex literals already used on the page you are editing.

---

## 3. Typography and hierarchy

- Marketing and app body: Inter (layout). Do not load a second font.
- Blog/article prose may use `@tailwindcss/typography` (`prose`) where articles already do.
- Hierarchy already in use:
  - Page titles: `text-2xl`–`text-3xl font-semibold` or `font-bold` on marketing heroes.
  - Section labels: `text-sm text-muted-foreground`.
  - Card titles (`components/ui/card.tsx`): `text-2xl font-semibold leading-none tracking-tight`.
  - Badges: `text-xs font-semibold`.
- Do not set `font-family` inline. Do not switch marketing pages to Arial (`styles/globals.css` is unused by the layout).

---

## 4. CTA and button rules

| Use | Component / class | When |
| --- | --- | --- |
| Shared UI button | `components/ui/button.tsx` `Button` | Forms, dialogs, admin-adjacent controls. Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. |
| Header purchase CTA | Link in `SiteHeader` / `MobileNav` | Keep gradient `from-orange-500 to-violet-700`, `rounded-md`, `text-sm`, white text. Label and href come from `components/site/nav.ts` `DEFAULT_CTA` (`/onboarding?plan=starter`, price from `lib/seo/facts.ts`). |
| Login | `components/auth/LoginButton.tsx` + `LoginModal` | Do not replace with a new auth UI. |
| Studio generate | `components/Studio/RenderButton.tsx` | Do not restyle or rewire. |
| Blog CTAs | `components/blog/BlogCtaLink.tsx` | Keep blog destinations (`lib/blog/site.ts` constants). |

Rules:

- One primary CTA per view. Secondary actions use `outline` or text links in `#9747ff`.
- Do not add a third gradient family.
- CTA copy must match a real route (`NAV_LINKS`, onboarding, human-polish, book-demo).
- Price in CTA text must call `usd()` / `PLANS` from `lib/seo/facts.ts`, not a new literal.

---

## 5. Card, badge, pricing, modal, and offer UI

**Cards.** `components/ui/card.tsx`: `rounded-lg border bg-card text-card-foreground shadow-sm`, header `p-6`, content `p-6 pt-0`. Marketing pages often skip this primitive and use `rounded-lg border border-[#343434] bg-[#0d1119]`. Match the page you are on; do not mix both on one section.

**Badges.** `components/ui/badge.tsx`: `rounded-full`, variants `default | secondary | destructive | outline`. Onboarding plan badges are custom (`Intro Plan` / `Most Popular` in `components/Onboarding/StepThree.tsx`). Do not add “Most Popular”, star ratings, or user counts unless that exact string already exists on the component you are editing. Do not invent new social proof.

**Pricing.** Two live price systems. Do not merge them into one table.

| System | Source of truth | Charged by |
| --- | --- | --- |
| Self-serve plans | Display: `lib/seo/facts.ts` `PLANS`, derived from `lib/pricing/catalog.ts` (`starter` $19.99 / 40 credits / week, `professional` $98 / 500 / month, `business` $349 / 6000 / month). Stripe IDs: `lib/stripe/plans.ts`. Annual checkout stays off until `STRIPE_PRICE_PRO_ANNUAL` and `STRIPE_PRICE_BUSINESS_ANNUAL` exist. | `POST /api/stripe/checkout` |
| Human Polish | Integer cents in `lib/human-polish/config.ts` (`AI_RENDER_PACK_STANDARD_PRICES_CENTS`, `BUILD_READY_STANDARD_PRICES_CENTS`). Labels: `lib/human-polish/types.ts`. | `POST /api/human-polish/checkout` |

Professional display is **$98**, the verified monthly Stripe amount. New UI reads `PLANS` or `lib/pricing/catalog.ts`. Do not introduce another Professional price. Annual amounts are not displayed until `GET /api/pricing/offers` returns a verified yearly `amountCents`.

**Modals.** `components/ui/dialog.tsx` (Radix). Login: `components/auth/LoginModal.tsx` (dark `#0a0a0a` / border `#1a1a1a`). Studio checkout success: `components/Studio/CheckoutSuccessDialog.tsx`. Tips: `components/Studio/TipsModal.tsx`.

**Offers.** No shared offer-state module exists. Do not add countdown, “only N left”, or fake urgency. Allowed urgency is only a fact already in config (example: Human Polish draft TTL is 15 minutes in `lib/human-polish/config.ts` — that is a real session rule, not a marketing timer). Affiliate or promo discounts do not exist as a shared module; Groups 3 and 6 must add them behind the contracts in §11 without changing Stripe price IDs.

---

## 6. Responsive guidelines

- Design mobile first, then `sm` / `md` / `lg`.
- Header: desktop links `lg+`; below `lg`, `components/site/MobileNav.tsx` must stay in sync with `NAV_LINKS`. Do not fork a second nav list.
- Studio layout is a **3-column desktop grid** (`components/Studio/StudioLayout.tsx`: `grid-cols-3`). Do not change that grid in conversion work.
- Touch targets: existing buttons are `h-10` (40px) or larger. Do not go below that for new primary CTAs.
- Images: use `next/image` or existing `SafeImage` / slider components. Do not hotlink new third-party before/after assets.

---

## 7. Accessibility and reduced motion

- Keep visible text contrast on `#0a0a0a` / `#101010`: white or `text-muted-foreground` (`#8c8c8c`). Do not put gray-on-purple for body copy.
- Icon-only controls need an accessible name (`sr-only` or `aria-label`), matching `LoginModal` close button.
- Dialogs use existing Radix `DialogTitle` / `DialogDescription` (see `LoginModal` `sr-only` titles).
- Nav current page: `aria-current="page"` (`SiteHeader`).
- **Reduced motion:** the repo does not define a global `prefers-reduced-motion` layer. New motion must be optional and must honor `@media (prefers-reduced-motion: reduce)` by disabling non-essential animation. Do not add autoplay sliders that cannot be paused. `RenderspaceBeforeAfterSlider` is pointer-driven; leave it pointer-driven.
- Do not remove focus rings (`focus-visible:ring-2` on `Button` and `Badge`).

---

## 8. Component reuse requirements

Future agents **must reuse** these. Do not duplicate them under a new folder.

| Need | Reuse |
| --- | --- |
| Marketing chrome | `components/site/SiteHeader.tsx`, `MobileNav.tsx`, `SiteFooter.tsx`, `components/site/nav.ts` |
| Logo | `/amethyst-flow.png`, `components/SpaceGenLogo.tsx` only if a surface already uses it |
| Buttons, cards, badges, inputs, dialogs, sheets, tabs | `components/ui/*` |
| Before/after | `components/RenderspaceBeforeAfterSlider.tsx` (props `categories`, `categoryOrder`). Also `components/mockup/BeforeAfterShowcase.tsx`, `components/share/BeforeAfterHero.tsx` |
| Contractor demo page | `components/contractor-demo/ContractorDemoPage.tsx` and section components beside it; data in `contractorDemoSliderData.ts` |
| Studio shell | `components/Studio/StudioLayout.tsx`, `GlobalHeader.tsx`, `FormPanel.tsx`, `StudioPreview.tsx`, `RenderButton.tsx`, `LatestRenders.tsx` |
| Auth | `components/auth/AuthContext.tsx`, `AuthProvider.tsx`, `LoginModal.tsx`, `LoginButton.tsx`, `CheckoutResume.tsx` |
| Onboarding | `components/Onboarding/StepOne.tsx`–`StepFour.tsx`, `app/onboarding/page.tsx` |
| Human Polish marketing | `components/human-polish/marketing/*` |
| Human Polish intake | `components/human-polish/intake/*` |
| SEO facts | `lib/seo/facts.ts` |
| Class names | `cn()` from `lib/utils.ts` |

New conversion-only components, if required, go under `components/conversion/<group-id>/` and must compose the primitives above. Do not edit `components/ui/*` variants unless a Group 0 follow-up says so. Group 0 does not add new primitives; none were required for integration.

---

## 9. Urgency, offers, and scarcity

Allowed:

- Restate real plan facts from `lib/seo/facts.ts` (price, credits, period, usage rights).
- Restate real Human Polish delivery targets and TTLs from `lib/human-polish/config.ts`.
- Show existing badges that already ship (Intro “First Job Test”, onboarding “Most Popular” on the Professional card).

Forbidden until a real data source exists in the repo:

- Fake deadlines, stock counters, “X people bought this”, invented reviews, invented ROI.
- “Limited spots” for self-serve Stripe plans.
- Changing `PROOF.rendersGenerated` (`"10,000"` in `lib/seo/facts.ts`) or implying a more precise number.

---

## 10. Analytics event naming

Measurement ID in `app/layout.tsx`: **`G-95W8Z5DE2P`** via gtag. Do not add a second property.

Existing helpers (do not break):

| Helper | File | Events |
| --- | --- | --- |
| `trackBlogEvent` | `components/blog/analytics.ts` | `blog_post_viewed`, `blog_cta_clicked` |
| `trackContractorDemoEvent` | `components/contractor-demo/analytics.ts` | free-form name; params are strings/numbers/booleans |
| `trackHumanPolishEvent` | `components/human-polish/analytics.ts` | typed map (`viewed_human_polish`, `initiated_checkout`, `completed_checkout`, …). Sanitizer: `lib/human-polish/analytics-params.ts` |
| `trackHomepageEvent` | `components/conversion/group-1/analytics.ts` | `homepage_viewed`, `hero_cta_clicked`, `guest_studio_started`, `first_render_completed`. Params: `variant` (`a`\|`b`), optional `destination`, optional `render_type`. |
| `trackGalleryEvent` | `components/gallery/analytics.ts` | `gallery_viewed`, `gallery_filter_applied`, `preset_opened`, `preset_studio_cta_clicked`, `preset_loaded`, `preset_render_completed`. Params: `preset_id`, `category`, `status`, `filter`, `has_query`, `destination`. Search text is not sent. |
| `trackPricingEvent` | `components/conversion/group-3/analytics.ts` | `billing_interval_selected`, `plan_recommended`, `plan_selected`, `promo_viewed`, `pricing_checkout_started`. Params: `plan`, `interval`, `promotion_id`, `status`. No payment data. |
| `trackLifecycleEvent` | `components/conversion/group-4/analytics.ts` | `lifecycle_offer_eligible`, `lifecycle_offer_viewed`, `lifecycle_offer_clicked`, `lifecycle_offer_dismissed`, `lifecycle_checkout_started`. Params: `offer_id`, `trigger`, `plan`, `status`. No payment data. |

Rules for new events:

- `snake_case` event names.
- No email, name, phone, address, tokens, or raw Stripe session ids in params (Human Polish already strips these).
- Do not fire analytics on `/admin`.
- No-op when `window.gtag` is missing or on the server.
- Self-serve ecommerce names, when the parallel analytics branch lands, are `sign_up`, `begin_checkout`, `purchase`, `generate_render`. **That code is not on this branch.** It lives on local branch `feat/ga4-conversion-events` (commits `19083b8`..`67a0f69`, not merged). Groups must not reimplement it. After that branch merges, call `trackEvent` from `lib/analytics/gtag.ts` and do not create a third gtag wrapper.

---

## 11. File and feature ownership (Groups 1–7)

Groups 1 and 7 are not given a product surface in the Group 0 brief. They may only add files under the namespace below and must not edit another group’s owned paths.

| Group | Owns (create or extend) | Must not change |
| --- | --- | --- |
| **1** | Homepage composition (`app/page.tsx`) and `components/conversion/group-1/**`. Guest Studio entry stays `/studio/exterior?demo=true`. | Stripe, gallery presets, generation APIs, Human Polish logic, contractor-demo pricing, affiliates. Do not change Studio auth. |
| **2** Gallery presets | `lib/gallery/presets.ts` (schema + typed presets) and gallery presentation that reads it. Public gallery: `app/gallery/page.tsx`, `app/gallery/[slug]/page.tsx`, `app/gallery/looks/[slug]/page.tsx`, `lib/content/gallery.ts`. Bot contract: `docs/conversion-optimization/GALLERY_PRESET_BOT.md`. | Content cron `app/api/cron/content-renders`, `lib/content/run.ts`, Stripe |
| **3** Canonical pricing | `lib/pricing/**`, `lib/seo/facts.ts` plan rows, `lib/stripe/plans.ts`, pricing UI that reads them. Checkout selects an existing env price by interval. Annual stays disabled until those env vars exist. | Hard-coded Stripe price IDs, Human Polish cents, migrating existing subscribers |
| **4** Offer state | `lib/offers/**` eligibility and `components/conversion/group-4/**`. Reads Group 3 campaigns. Discounts stay in Checkout. | Do not store a second price. Do not invent scarcity. |
| **5** Premium availability | Human Polish / assisted sales already exist: `app/human-polish/**`, `app/book-demo/**`, `NEXT_PUBLIC_PREMIUM_BOOKING_URL` (`components/book-demo/BookDemoContent.tsx`). New flags, if any, in future `lib/premium/availability.ts` reading those modules. | Do not rewrite HP checkout, webhooks, or private storage. |
| **6** Affiliate attribution | Future `lib/affiliates/` that **composes** with first-touch attribution after `feat/ga4-conversion-events` merges (`rs_attrib` cookie, `profiles.signup_*`). Discounts applied only through Group 3. | Do not replace Supabase auth cookies or Stripe customer ids. |
| **7** | `components/conversion/group-7/**` only, until its brief names a page. | Same forbidden set as Group 1 |
| **All** | Analytics via existing helpers (§10) | New gtag wrappers, PII params |

Shared contracts (do not implement in Group 0):

- **Pricing config:** Group 3 is the only writer. Others import.
- **Gallery preset schema:** Group 2 is the only writer. Shape must be typed; no `any`.
- **Promotion eligibility:** Group 4 computes boolean eligibility from Group 3 prices and real user/session facts. Group 3 owns the discount amount.
- **Affiliate:** Group 6 owns click ids and partner records. Group 3 owns whether a discount applies.
- **Premium availability:** Group 5 exposes a boolean + href. It does not render other groups’ CTAs.
- **Analytics:** every group emits through §10. Event names are registered by appending a line to this file’s §10 table in the same PR.

---

## 12. Architecture map

```
Browser (www.renderspace.ai)
  middleware.ts          apex → www 308; studio ?demo=true sets renderspace_demo_mode
  app/layout.tsx         Inter, gtag G-95W8Z5DE2P, Auth, LoginModal, CheckoutResume
  Marketing              SiteHeader/Footer, gallery, pricing, blog, contractor-demo, human-polish
  Onboarding             app/onboarding → StepFour → POST /api/stripe/checkout
  Studio                 app/studio/layout.tsx (session required unless demo cookie)
                         exterior + landscape → POST /api/generate-openrouter
                         interior → POST /api/generate-replicate
                         credits: lib/usage/enforceCredits.ts
  Auth                   Supabase PKCE
                         browser: lib/supabase/client.ts
                         server: lib/supabase/server.ts
                         callback: app/auth/callback/route.ts
  Stripe                 checkout route + app/api/stripe/webhook/route.ts
                         portal: app/api/stripe/portal/route.ts
                         Human Polish is a separate Checkout Session (mode payment)
  Supabase               Auth + profiles + content_render_* + human_polish_* + storage
                         Service role only on server (lib/human-polish/supabase.ts, enforceCredits)
  Content bot            vercel.json crons → /api/cron/content-renders
  Human Polish cron      /api/cron/human-polish-pack-expiration
```

**Auth / session.** `components/auth/AuthProvider.tsx` (Supabase session) and `AuthContext.tsx` (login modal). Studio layout redirects anonymous users to `/?login=1` unless demo cookie is set. Do not weaken this.

**Subscriptions.** Plan codes in Stripe checkout: `intro | professional | business` (`lib/stripe/plans.ts`). Profile fields include `current_plan`, `subscription_status` (used by `CheckoutResume`).

**RLS / storage.** Human Polish uploads use private bucket `human-polish-uploads` and signed URLs (`lib/human-polish/config.ts`). Content tables are service-role oriented (`supabase/migrations/20261015000000_content_render_bot.sql`). Do not add anon policies.

**Feature flags.** No feature-flag framework. The only runtime switches found are env vars (Stripe price IDs, `CRON_SECRET`, `HUMAN_POLISH_ADMIN_EMAILS`, `NEXT_PUBLIC_PREMIUM_BOOKING_URL`, `NEXT_PUBLIC_APP_URL`). Do not add a flag service in Group 0.

---

## 13. Shared configuration and dependency contracts

| Concern | Contract |
| --- | --- |
| App URL | `lib/blog/site.ts` `getBlogSiteOrigin()` or `lib/human-polish/app-url.ts`. Production host www. |
| Self-serve price display | `lib/seo/facts.ts` only |
| Self-serve Stripe price | `getStripePriceId()` only. Never hard-code `price_…` |
| HP price | `lib/human-polish/config.ts` cents. Browser must not send a price. |
| Auth callback URL | `lib/auth/callback-url.ts` `getAuthCallbackUrl()` |
| Post-login redirect | `lib/auth/safe-return-path.ts` (open-redirect safe) |
| Credits | `enforceCredits` / `consumeCredit` / `recordRenderEvent`. Conversion UI must not call these. |
| Secrets | Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `CRON_SECRET`, `OPENROUTER_API_KEY`, `REPLICATE_API_TOKEN`. Never `NEXT_PUBLIC_` for secrets. Never log them. |
| Tests | Node test runner via `npx tsx --test <file>`. Examples: `lib/seo/schema.test.ts`, `lib/content/concepts.test.ts`, `lib/auth/safe-return-path.test.ts`. |
| Deploy | `vercel.json` crons. `docs/VERCEL_DEPLOY.md`. Agents do not deploy. |

Dependency versions (do not bump for conversion UI): Next `^16.1.0`, React `^18.3.1`, Tailwind stack in `package.json`, Supabase JS `^2.87.1`, `@supabase/ssr` `^0.7.0`, Stripe `^19.1.0`.

---

## 14. Integration, rollback, and QA

**Integration**

- One concern per PR. Do not mix Studio generation edits with marketing UI.
- Import shared modules; do not copy price tables into components.
- If two groups need the same new file, the owner in §11 creates it first and the other group waits.
- Recommended merge order into `enhanced-studio-ui`:
  1. `feat/conversion-design-foundation` (this doc).
  2. `feat/ga4-conversion-events` (analytics primitives) before any group emits `sign_up` / `purchase`.
  3. Group 3 pricing contract.
  4. Group 2 gallery preset schema.
  5. Group 5 premium availability.
  6. Groups 4 and 6 (offers, affiliates) after 3.
  7. Groups 1 and 7 presentation last.

**Rollback**

- Conversion UI must be deletable by reverting its own directory (`components/conversion/group-*` or the owner’s new `lib/` file) without migrating data.
- Do not add NOT NULL columns or destructive migrations for conversion experiments.
- Do not change existing Stripe products.

**QA (every group)**

- `npx tsc --noEmit`
- `pnpm run lint` (existing warnings may predate the PR; do not add new ones in touched files)
- `pnpm run build` before merge
- `npx tsx --test` on any new `*.test.ts`
- Desktop and mobile check of every page whose JSX changed
- Confirm Studio generate, login, and Stripe checkout still reach the same API routes
- No new secrets in git

**Visual baseline.** Group 0 did not change UI, so no screenshot set was produced. Groups that change UI capture before/after desktop and mobile of the touched route only.

---

## Inventory (quick)

**Tokens:** `tailwind.config.ts`, `app/globals.css`, Inter in `app/layout.tsx`.  
**UI kit:** `components/ui/*` (shadcn-style Radix).  
**Marketing:** `components/site/*`, `components/HomepageFAQ.tsx`, `app/pricing`, `app/gallery`.  
**Sliders:** `components/RenderspaceBeforeAfterSlider.tsx`.  
**Studio:** `components/Studio/*`, `app/studio/*`, `app/api/generate-openrouter`, `app/api/generate-replicate`.  
**Billing:** `app/api/stripe/*`, `lib/stripe/plans.ts`, `lib/seo/facts.ts`.  
**Human Polish:** `app/human-polish/*`, `lib/human-polish/*`, `components/human-polish/*`.  
**Contractor demo:** `app/contractor-demo/*`, `components/contractor-demo/*`.  
**Tests:** `lib/**/*.test.ts` (10 files at time of writing). No Playwright suite in `package.json`.  
**Deploy:** Vercel, `vercel.json` crons, `docs/VERCEL_DEPLOY.md`.
