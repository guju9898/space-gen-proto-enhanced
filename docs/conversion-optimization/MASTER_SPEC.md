# Renderspace conversion optimization — master specification

Group 0 contract. Every later conversion agent follows this file. It describes the repository as it exists on branch `enhanced-studio-ui` (base for this work). It does not authorize a redesign.

Brand, navigation, page structure, the dark theme, and the purple accent stay. Do not adopt another product's visual identity. Do not restyle a working page in order to use a new primitive.

## 1. Brand and design principles

Renderspace (`https://www.renderspace.ai`, canonical host `www.renderspace.ai` via `middleware.ts`) is a dark, premium tool for pool builders, landscapers, outdoor-living contractors, remodelers, and designers. The product turns a job-site photo into a photorealistic concept.

Principles, taken from the live marketing pages:

- One job: show the finished project before the quote. Copy stays specific to that job.
- Dark surfaces, white headings, muted body text, one purple accent (`primary`).
- The primary action is an orange-to-violet gradient. The secondary action is a white outline. See §4.
- Prices, credit counts, turnaround, and usage rights that appear in SEO or UI come from an existing source of truth (§13). They are not retyped in new components.
- Proof that is allowed to be repeated is `PROOF` in `lib/seo/facts.ts`: more than 10,000 renders, and about 30 seconds (range 20–40) from photo to concept. Do not add testimonials, star ratings, customer counts, win rates, or "most popular" claims. The onboarding card already labels Professional "Most Popular"; leave that label where it is and do not copy it onto new surfaces.
- The interactive ROI calculator (`components/RoiCalculator.tsx`) is a calculator. Its output is not a customer result and must not be quoted as one.
- `/pricing` already says one render can help close a $20,000 project and that the product costs less than 0.5% of a single job. Leave that sentence on that page. Do not turn it into a case study, a quote, or a new percentage.
- Human Polish™ is a separate done-for-you service. Its disclaimer lives in `components/human-polish/marketing/marketingConfig.ts` (`REQUIRED_DISCLAIMER`). Do not imply architectural, engineering, permit, or code-compliance work.
- Logo: `/amethyst-flow.png`, wordmark "Renderspace" (`components/site/SiteHeader.tsx`). `components/Header.tsx` renders "Space Gen" and is not imported anywhere. Do not use it.
- Theme: `next-themes` with `defaultTheme="dark"` (`app/layout.tsx`). New marketing UI is designed for that dark theme.

## 2. Design tokens and their source files

There is no single token file. Three layers exist, and they do not fully agree. Use the layer the live page already uses. Do not add a third palette.

### 2.1 Tailwind theme — `tailwind.config.ts`

This is what utility classes resolve to. Three colors are hardcoded and therefore **win over** the CSS variables below:

| Token | Utility | Value |
| --- | --- | --- |
| `background` | `bg-background` | `#101010` |
| `primary` | `bg-primary`, `text-primary` | `#9747ff` |
| `muted.foreground` | `text-muted-foreground` | `#8c8c8c` |

Every other color in `theme.extend.colors` is `hsl(var(--…))` and comes from `app/globals.css`.

Radius tokens: `lg` = `var(--radius)`, `md` = `calc(var(--radius) - 2px)`, `sm` = `calc(var(--radius) - 4px)`.

Container: centered, padding `2rem`, `2xl` screen `1400px`.

Animations defined in Tailwind: `accordion-down` and `accordion-up` only. `tailwindcss-animate` and `@tailwindcss/typography` are the plugins.

`styles/globals.css` is not imported by any file. It sets Arial and a neutral shadcn palette. Ignore it. The live stylesheet is `app/globals.css`, loaded from `app/layout.tsx`. `components.json` correctly points at `app/globals.css`.

### 2.2 CSS variables — `app/globals.css` (live)

`:root` is a light palette. `.dark` is what users see, because the root layout forces dark. Relevant `.dark` values:

| Variable | HSL |
| --- | --- |
| `--background` | `240 10% 4%` |
| `--foreground` | `0 0% 98%` |
| `--card`, `--popover` | `240 10% 4%` |
| `--primary` | `272 100% 64%` |
| `--primary-foreground` | `0 0% 98%` |
| `--secondary`, `--muted`, `--accent`, `--border`, `--input` | `240 3.7% 15.9%` |
| `--muted-foreground` | `240 5% 64.9%` |
| `--destructive` | `0 62.8% 30.6%` |
| `--ring` | `272 100% 64%` |
| `--radius` | `0.5rem` |

`bg-background`, `bg-primary`, and `text-muted-foreground` do **not** read these variables. `border-border`, `bg-card`, `bg-secondary`, `bg-muted`, `text-foreground`, and `ring-ring` do.

`--primary` (`272 100% 64%`) is close to `#9747ff` but is not the same hex. Do not "correct" one toward the other.

A local `.animate-fade-in` (0.3s) is defined in `app/globals.css` and used by a few Studio modals.

### 2.3 Hardcoded marketing hex

These are the surfaces on the homepage, pricing, gallery, and Human Polish marketing sections. New marketing cards use the same values. Shared class strings for **new** UI live in `lib/conversion/marketing-surfaces.ts`. Do not refactor existing pages onto that module.

| Use | Value | Where it shows up |
| --- | --- | --- |
| Page background utility | `#101010` | `bg-background`; also `SiteFooter` |
| Card fill | `#191f33` at 50%, 60%, or solid | Homepage, pricing, Human Polish cards |
| Hairline border | `#343434` | Those cards, footer, mobile sheet |
| Comparison panel | `#050816` / 80, border `#343434`, `rounded-2xl` | `components/ComparisonTable.tsx` |
| Before/after frame | `#191f33`, border `white/10`, `rounded-xl` | `components/RenderspaceBeforeAfterSlider.tsx` |
| Icon disc gradient | `#9747ff` → `#8608fd` | Homepage feature discs |
| Studio type chip (Studio only) | `#FF6B00` → `#9747ff` | `components/Studio/StudioTypeSelector.tsx` |
| Onboarding selection | border `#8b5cf6` or `#ec4899`; selected button `#ec4899` → `#8b5cf6` | `components/Onboarding/StepThree.tsx` |

Studio chrome is a separate zinc scale (`bg-zinc-900`, `bg-zinc-800`, `border-zinc-700`). Conversion work does not restyle Studio.

### 2.4 Spacing, radius, shadow

Spacing is the Tailwind default scale. Marketing sections use `container mx-auto px-4`, with `py-16 md:py-24` on heroes and `py-12 md:py-16` on the gallery hero. Card padding is `p-6` or `p-8`. Grids use `gap-4` or `gap-6`.

Radius in practice:

- Buttons and inputs: `rounded-md`
- Marketing cards: `rounded-xl`
- Comparison table: `rounded-2xl`
- Badges and slider tabs: `rounded-full`
- shadcn `Card`: `rounded-lg` (`components/ui/card.tsx`)

Shadows are the default Tailwind scale (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`). There is no custom shadow token. Do not add one.

### 2.5 Breakpoints

Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. The container caps at 1400px.

`components/ui/use-mobile.tsx` treats widths under 768px as mobile. Marketing navigation does not use that hook. Desktop nav is `hidden lg:flex` and the menu button is `lg:hidden` (`components/site/SiteHeader.tsx`, `components/site/MobileNav.tsx`). A layout change at `md` that leaves the header on the desktop nav will overflow. Match the header: stack at `lg`.

## 3. Typography and hierarchy

The live font is **Inter**, loaded with `next/font/google` in `app/layout.tsx` and applied to `<body>`. Tailwind has no `fontFamily` override. Do not load a second font.

| Role | Classes in use |
| --- | --- |
| Eyebrow | `text-sm font-medium text-primary` |
| Page title | `text-4xl md:text-5xl font-bold text-white` |
| Section title | `text-2xl md:text-3xl font-bold text-white` |
| Card title | `text-white font-bold` or `text-xl font-semibold text-white` |
| Supporting copy | `text-muted-foreground`, often `max-w-2xl mx-auto` |
| Fine print | `text-xs text-muted-foreground` |
| Nav link | `text-sm`, active `text-white`, inactive `text-muted-foreground` |
| Price figure | `text-3xl font-bold text-white` |

Titles use the root layout template `"%s | Renderspace"` unless the page sets `absoluteTitle` (`lib/seo/metadata.ts`). Do not put the brand in a title that also uses the template.

Body copy is sentence case. The product name is Renderspace. The service name is Human Polish™.

## 4. CTA and button rules

Two marketing actions, already implemented as `<Link>` elements rather than `components/ui/button.tsx`:

- **Primary.** `bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white rounded-md`. Header size is `text-sm px-4 py-2`. Hero size is `px-6 py-3 font-medium`. One primary action per view.
- **Secondary.** `border border-white/30 hover:bg-white/10 text-white rounded-md`. Same padding scale as the primary next to it.

The header label and href come from `DEFAULT_CTA` in `components/site/nav.ts`: `/onboarding?plan=starter`, label `Try It for ${usd(PLANS.starter.priceUsd)}`. Pass a different `cta` prop into `SiteHeader` only when the page's existing action is different. Do not change `DEFAULT_CTA` until the plan-query bug in §13 is fixed by Group 3.

`components/ui/button.tsx` (shadcn, `class-variance-authority`) is the control for Studio, account, dialogs, and Human Polish forms. Variants: `default` (solid `bg-primary`), `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default` `h-10`, `sm` `h-9`, `lg` `h-11`, `icon`. Use it inside product UI and dialogs. Do not replace the marketing gradient links with `Button variant="default"`. That would turn them solid purple.

`components/Studio/RenderButton.tsx` is the Studio generate control (`from-primary via-purple-600 to-indigo-600`). Conversion work does not reuse it on marketing pages and does not restyle it.

Onboarding's selected-plan button uses a pink-to-violet gradient (`#ec4899` → `#8b5cf6`). That stays inside onboarding. New marketing UI uses the orange-to-violet gradient.

A view has one primary CTA. A second action is the outline style or a `text-primary` text link (`Questions? See our FAQ` on the pricing page).

## 5. Cards, badges, pricing, modals, offers

### Cards

Marketing cards are `div`s with the classes in §2.3, not `components/ui/card.tsx`. Account pages (`app/subscription/page.tsx`, `app/profile/page.tsx`) and `components/Studio/StudioPageLayout.tsx` use the shadcn `Card`. Match the surface you are on.

### Badges

- Intro / First Job Test chip: `bg-amber-600 text-white text-xs px-2.5 py-0.5 rounded-full font-medium`, absolutely positioned on the card (`-top-2.5 left-1/2 -translate-x-1/2` on pricing, `-top-3 right-4` on onboarding).
- shadcn `Badge` (`components/ui/badge.tsx`) is used in Studio (`components/Studio/RequestSummary.tsx`). Variants: `default`, `secondary`, `destructive`, `outline`.
- Do not add a "Most popular", "Only N left", or countdown badge. The existing onboarding "Most Popular" chip stays put.

### Pricing

Self-serve plans are three:

| Marketing key (`PLANS`) | Checkout / onboarding id | Name in facts | Name in onboarding | Displayed price today |
| --- | --- | --- | --- | --- |
| `starter` | `intro` | First Job Test | Intro Plan | $19.99 / 7 days, 40 credits |
| `professional` | `professional` | Professional | Professional | **$99** on homepage, pricing, facts, intro modal, ROI labels. **$98** on onboarding Steps 3–4 and `components/contractor-demo/PlanSelectionSection.tsx` |
| `business` | `business` | Business | Business | $349 / month, 6,000 credits |

Credits and the 4K / usage-rights lines in `lib/seo/facts.ts` agree across those surfaces. The Professional dollar amount does not. Group 3 reconciles it against the live Stripe price. Until that lands, do not type a new Professional price into a component.

Human Polish prices are integer cents in `lib/human-polish/config.ts`. Marketing copy reads them through `components/human-polish/marketing/marketingConfig.ts`. The browser never supplies a price.

### Modals

- Radix dialog: `components/ui/dialog.tsx`. Overlay `bg-black/80`, content `bg-background`, `sm:rounded-lg`, focus ring on the close button. Studio checkout success passes `bg-[#0a0a0a] border border-[#1a1a1a]`.
- Sheet (mobile nav): `components/ui/sheet.tsx`, content `border-[#343434] bg-background`.
- Intro modal: `components/marketing/IntroModal.tsx` (custom overlay `bg-black/60`, not the shadcn Dialog).
- Intro promo: `components/marketing/IntroPlanPromo.tsx`, `role="dialog"`, fixed bottom card, dismiss key `renderspace_promo_hidden` in `localStorage`.
- Demo gates: `components/demo/DemoEmailGate.tsx`, `DemoLimitModal.tsx`, `DemoLimitReachedModal.tsx`.

New modals use `components/ui/dialog.tsx` or `sheet.tsx` so focus trap, Escape, and the accessible title come from Radix. The intro modal's hand-rolled dialog is not the pattern to copy.

### Offers that exist

| Offer | Where it is decided | Notes |
| --- | --- | --- |
| Intro subscription | `intro_offer_claims` (one row per user). Checkout returns 403 if claimed. Webhook writes the claim. | Display key `starter`, checkout id `intro`. Stripe Checkout `mode` is `subscription` even for intro. Metadata sets `rollover_plan=professional` and `intro_credits=40`. |
| Human Polish first purchase | Server, 25-pack only, $349 vs $399 (`AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS`). Phone history. | `promotion_type` `first_purchase_25`. |
| Human Polish subscriber | 15% for an authenticated active Professional or Business subscriber. | `subscriber_15`. Does not stack with the first-purchase price. |
| `NEW15` / "Flash Launch Offer" / "Limited time" | Copy only, in `IntroPlanPromo`. | Checkout does not read a coupon. Do not treat `NEW15` as a real code. Do not add a second urgency banner. |

Group 4 may change offer **presentation** inside the files it owns. Group 3 decides eligibility. Neither may invent a deadline, a remaining-quantity, or a discount that Stripe does not already have.

## 6. Responsive and mobile guidelines

- Build the mobile layout first at the same breakpoints the page already uses. Header collapses under `lg` (1024px).
- Hero CTA rows are `flex flex-col sm:flex-row`. Full-width buttons on small screens, inline from `sm`.
- Pricing and feature grids are one column until `md`.
- The mobile menu is `components/site/MobileNav.tsx`. It closes before opening the login modal so two dialogs do not fight. Keep that order.
- Do not introduce a second header. Marketing pages use `SiteHeader` + `SiteFooter`. Studio uses `components/Studio/GlobalHeader.tsx`.
- Images in marketing grids use explicit `width`/`height` or a stable aspect ratio (`aspect-[4/3]`, `object-cover`).
- Touch targets on new controls are at least the existing button heights (`h-10` or `py-3`).

## 7. Accessibility and reduced motion

Follow the patterns already in the shared chrome:

- `lang="en"` on `<html>`.
- Nav landmarks: `aria-label="Main"`, `aria-label="Mobile"`, `aria-label="Footer"`. Current page uses `aria-current="page"`.
- Icon-only buttons need `aria-label` (the slider, lightbox, and modal close buttons already do). Decorative icons use `aria-hidden`.
- shadcn buttons include `focus-visible:ring-2 focus-visible:ring-ring`. Do not remove the ring.
- Dialogs use a real title (Radix `DialogTitle`, or `SheetTitle`). `sr-only` is acceptable when the visual heading is elsewhere.
- Form errors use `aria-invalid` and `aria-describedby`, as in `components/payment/FormInput.tsx`.
- The mobile sheet is the Radix dialog primitive (focus trap, Escape, focus return).

There is **no** `prefers-reduced-motion` rule in the repo today. Do not add a global one; it would change Studio and Radix motion on existing pages. New conversion UI uses Tailwind `motion-reduce:` variants (`motion-reduce:animate-none`, `motion-reduce:transition-none`) on any animation it introduces. Do not add looping or autoplay motion. The before/after slider's nudge must keep working for pointer and keyboard users; if you touch it, preserve a reduced-motion path.

Color contrast: white text on `#101010` / `#191f33`, and white text on the orange-violet gradient, is the existing pairing. Muted text is `#8c8c8c` via `text-muted-foreground`. Do not put `text-muted-foreground` on the amber badge or on the gradient.

## 8. Component reuse

Use these. Do not recreate them.

| Need | Use |
| --- | --- |
| Marketing header, footer, nav list, default CTA | `components/site/SiteHeader.tsx`, `SiteFooter.tsx`, `MobileNav.tsx`, `nav.ts` |
| Login button and modal | `components/auth/LoginButton.tsx`, `LoginModal.tsx`. Open the modal through `useAuth().openLoginModal` from `components/auth/AuthContext.tsx`. |
| Class merge | `cn` from `lib/utils.ts` |
| Marketing class strings for **new** UI | `lib/conversion/marketing-surfaces.ts` |
| New analytics events | `trackConversionEvent` from `lib/conversion/track.ts` |
| Buttons in product UI | `components/ui/button.tsx` |
| Dialogs, sheets, alerts | `components/ui/dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx` |
| Before/after | `components/RenderspaceBeforeAfterSlider.tsx`. Optional `categories` and `categoryOrder` props are how the contractor demo overrides the homepage pair. Keep those props working. |
| Comparison and ROI | `components/ComparisonTable.tsx`, `components/RoiCalculator.tsx` |
| Homepage FAQ | `components/HomepageFAQ.tsx` |
| SEO | `pageMetadata` (`lib/seo/metadata.ts`), `JsonLd`, `lib/seo/schema.ts`, `lib/seo/facts.ts` |
| Prices displayed to humans | `usd` and `count` from `lib/seo/facts.ts` |
| Human Polish marketing figures | `components/human-polish/marketing/marketingConfig.ts` only |
| Gallery images that are published renders | `listPublishedRenders` / `getPublishedRender` (`lib/content/gallery.ts`) |
| Share-page before/after and lightbox | `components/share/BeforeAfterHero.tsx`, `ConceptGallery.tsx`, `ImageLightbox.tsx` |
| Safe remote images | `components/SafeImage.tsx` where a page already uses it |

shadcn primitives under `components/ui/*` are available (accordion, badge, card, form, input, select, tabs, tooltip, and the rest of that directory). Prefer an existing primitive over a new one.

`components/Header.tsx` and `styles/globals.css` are unused. Do not build on them.

## 9. Urgency, offers, and scarcity

Allowed:

- Repeat an offer that the server already enforces (intro claim, Human Polish first-purchase 25-pack, Human Polish 15% subscriber discount).
- State a fact from `lib/seo/facts.ts` or `lib/human-polish/config.ts` (price, credits, delivery window, 90-day pack expiration, 7-day intro).
- Say that the intro offer is one per account, because `intro_offer_claims` enforces that.

Not allowed:

- Countdown timers, "only N left", fake capacity, invented coupons, or "limited time" on any new component.
- Extending the `NEW15` / "Flash Launch Offer" copy. It is not backed by checkout.
- Stacking the Human Polish first-purchase price with the subscriber discount.
- Accepting a price, discount, or promotion code from the browser as the charged amount.
- Publishing a city testimonial or local price. `lib/contractor-demo/cities.ts` says city pages stay noindex until they have real local content. Slugs today: `houston`, `dallas`, `austin`. Any other slug 404s.

## 10. Analytics

The site loads gtag in `app/layout.tsx` (Google tag `G-95W8Z5DE2P`). There is no other product analytics SDK. Do not add one.

### Existing event names (frozen)

Human Polish (`components/human-polish/analytics.ts`), typed, sanitized:

`viewed_human_polish`, `selected_service_family`, `selected_render_pack`, `clicked_build_ready`, `clicked_custom_quote`, `started_intake`, `created_intake_draft`, `uploaded_files`, `completed_intake`, `accepted_scope`, `viewed_order_summary`, `requested_rush`, `requested_call`, `clicked_whatsapp`, `initiated_checkout`, `completed_checkout`, `checkout_cancelled`, `first_purchase_promo_viewed`, `first_purchase_promo_applied`, `subscriber_discount_applied`.

Blog (`components/blog/analytics.ts`): `blog_post_viewed`, `blog_cta_clicked`. Params limited to `slug`, `category`, `destination`.

Contractor demo (`components/contractor-demo/analytics.ts`): `viewed_contractor_demo`, `loaded_city_slug`, `clicked_premium_cta`, `clicked_business_cta`, `clicked_professional_cta`, `clicked_try_demo`, `viewed_mailer_section`. Params today are `{ city }`.

Commented TODOs, not implemented: `intro_checkout_started`, `intro_plan_selected`, `intro_modal_viewed`, `intro_modal_started`.

### New events

Call `trackConversionEvent` (`lib/conversion/track.ts`). Do not call `gtag` directly. Do not add a fourth wrapper.

Name shape: `{surface}_{action}` in snake_case, 2–40 characters, starting with a letter. `isConversionEventName` rejects anything else, and the helper then no-ops.

| Surface prefix | Owner |
| --- | --- |
| `home_`, `faq_`, `mockup_` | Group 1 |
| `gallery_` | Group 2 |
| `pricing_`, `checkout_` | Group 3 |
| `offer_` | Group 4 |
| `premium_` | Group 5 |
| `affiliate_` | Group 6 |
| `onboarding_` | Group 7 |

Action is a verb phrase: `pricing_plan_selected`, `gallery_preset_opened`, `offer_dismissed`. Do not rename a frozen event to match this shape.

Parameters: short strings, numbers, or booleans. The sanitizer in `lib/human-polish/analytics-params.ts` drops keys that look like email, phone, name, company, address, request id, session id, token, Stripe id, filename, path, note, or description. Do not put those in params. Do not put the raw `src` / `rep` values in analytics if they can identify a person; send a boolean such as `hasAttribution` instead.

No-op when `window.gtag` is missing (local dev, blocked tag). Do not throw.

## 11. File and feature ownership

Group 0 (this branch) owns:

- `docs/conversion-optimization/**`
- `lib/conversion/**`

Later groups import `lib/conversion/**`. They do not rewrite it except to add a line to the surface-prefix table above in this spec when a new surface is real.

The invoking brief assigns product work to Groups 2–6. Groups 1 and 7 were not given a feature in that brief. The lanes below exist so those agents do not edit the same files as Groups 2–6. If a later brief contradicts a Group 1 or Group 7 **product** lane, that brief wins for product scope. The frozen list still wins.

### Frozen for every group

Do not modify these unless a change is required to compile a file you own, and even then keep the diff to a call-site of a new pure function.

- Studio generation: `app/studio/**` (except a future, separately briefed banner), `components/Studio/**`, `hooks/studio/**`, `hooks/useDesignConfig.tsx`, `hooks/useRenderEngine.ts`, `lib/studio/**`, `lib/prompt/**`, `lib/api/generateImage.ts`, `lib/api/generateImageFromOpenRouter.ts`, `types/studio.ts`, `constants/studioOptions.ts`
- Generation routes: `app/api/render/route.ts`, `app/api/generate-replicate/route.ts`, `app/api/generate-openrouter/route.ts`, `app/api/generate-interior/route.ts`, `app/api/demo-render/route.ts`, `pages/api/generate.ts`
- Credits: `lib/usage/**`, `app/api/credits/status/route.ts`
- Stripe price IDs and the subscription webhook: `lib/stripe/plans.ts` (env names and the three plan codes), `app/api/stripe/webhook/route.ts`, `app/api/stripe/portal/route.ts`. Group 3 is the only group that may edit `app/api/stripe/checkout/route.ts`, and only to call a Group 6 pure function. It does not change price IDs, `mode`, or success/cancel URLs.
- Auth mechanics: `app/auth/**`, `components/auth/**`, `lib/auth/**`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`
- Human Polish implementation: `lib/human-polish/**`, `components/human-polish/**`, `app/human-polish/**`, `app/api/human-polish/**`, `app/admin/**`
- Supabase: do not edit an existing file in `supabase/migrations/**`. A new migration is allowed only for the group that owns the feature, it must enable RLS, and it must not weaken a current policy. Private buckets stay private (`human-polish-uploads` and the allowlist in `20260810120000_restrict_legacy_storage_object_policies.sql`: `reference-images`, `renders`).
- Content bot: `lib/content/**` except `lib/content/gallery.ts` reads. Group 2 does not change cron prompts or QC.
- Root chrome providers: `app/layout.tsx` (font, theme, auth providers, gtag, intro modal mount)
- Deploy config: `vercel.json`, `next.config.js`
- Secrets: no env values in git. No new `NEXT_PUBLIC_` secret.

### Group lanes

| Group | Owns (new work) | May edit | Must not |
| --- | --- | --- | --- |
| 1 | Homepage, FAQ, and mockup-method presentation | `app/page.tsx`, `app/faq/**`, `app/mockup-method/**`, `components/HomepageFAQ.tsx`, `components/ComparisonTable.tsx`, `components/RoiCalculator.tsx`, `components/mockup/**` | Change the before/after slider's public props. Edit `nav.ts` link list. |
| 2 | Gallery preset schema and gallery presentation that reads it | New files under `lib/gallery/**` and `components/gallery/**`. `app/gallery/**` and `app/components/filter-bar.tsx` for wiring. | Replace `GalleryRender` or the published-only filter in `lib/content/gallery.ts`. Invent images. |
| 3 | Canonical **display** catalog and checkout discount application | New `lib/pricing/**`. Display call sites that hardcode `$99` / `$98` / `$19.99` once the catalog is the source: `app/pricing/page.tsx`, `app/page.tsx` price block, onboarding price tables, contractor-demo plan prices. Sole editor of `app/api/stripe/checkout/route.ts`. | Change Stripe price id env names or values. Change `lib/human-polish/config.ts` cents. |
| 4 | Offer UI and client offer state | `components/marketing/IntroModal.tsx`, `components/marketing/IntroPlanPromo.tsx`. New `lib/offers/**`, `components/offers/**`. | Decide eligibility locally. Add urgency copy. Apply a price. |
| 5 | Premium service availability | New `lib/premium/**`. Read-only use of Human Polish and book-demo hrefs. | Rewrite Human Polish checkout, intake, or admin. Hide a service by deleting its route. |
| 6 | Affiliate attribution capture | New `lib/affiliates/**`, `components/affiliates/**`. | Edit the checkout route. Put PII in the code or in analytics. Invent a discount percent. |
| 7 | Onboarding and book-demo presentation | `app/onboarding/**`, `components/Onboarding/**`, `app/book-demo/**`, `components/book-demo/**` | Change auth callbacks, `normalizePlanFromQuery` accepted ids, or the checkout request body shape. |

Shared components (`components/site/**`, `components/RenderspaceBeforeAfterSlider.tsx`) stay backward compatible. A group that needs a new nav link adds it only with an updated row in this spec.

`components/contractor-demo/**` and `app/contractor-demo/**` are shared-frozen. Group 3 may replace hardcoded plan prices there with the catalog. Group 5 may read availability. Nobody else edits them.

## 12. Architecture map

### Routing

App Router under `app/`. A legacy Pages route remains at `pages/api/generate.ts`. Do not add new Pages routes.

Public marketing: `/`, `/gallery`, `/gallery/[slug]`, `/pricing`, `/faq`, `/contractor-demo`, `/contractor-demo/[city]`, `/mockup-method`, `/human-polish`, `/blog`, `/blog/[slug]`, `/book-demo`.

Account and product: `/onboarding`, `/auth/login`, `/auth/callback`, `/auth/confirm`, `/studio` (redirects to `/studio/interior`), `/studio/interior`, `/studio/exterior`, `/studio/landscape`, `/studio/projects`, `/studio/projects/[projectId]`, `/studio/workspace`, `/studio/variables`, `/subscription`, `/profile`, `/payment`.

Private sales assets (noindex header in `next.config.js`): `/view/[slug]`, `/mockup/[slug]`.

Admin: `/admin/human-polish`, `/admin/content`.

### Auth and session

Two client providers are nested in `app/layout.tsx`:

1. `components/auth/AuthProvider.tsx` — session object, `useSession()`.
2. `components/auth/AuthContext.tsx` — user, login modal, `useAuth()`. Also upserts `profiles` on first session.

Server clients: `createSupabaseServerClient()` in `lib/supabase/server.ts` (cookie `getAll`/`setAll`, anon key). Browser client: `lib/supabase/client.ts`.

`app/studio/layout.tsx` allows the request when cookie `renderspace_demo_mode=1`. Otherwise it redirects to `/?login=1` when `getSession()` is empty. `middleware.ts` sets that cookie for one hour when the path starts with `/studio` and `?demo=true`, and deletes it on other `/studio` requests. Middleware also 308-redirects `renderspace.ai` to `www.renderspace.ai`.

Service-role clients (`lib/human-polish/supabase.ts`, checkout, credits, uploads) are server-only. Never import them into a client component.

### Studio generation

| Page | Endpoint |
| --- | --- |
| `/studio/interior` | `POST /api/generate-replicate` |
| `/studio/exterior`, `/studio/landscape` | `POST /api/generate-openrouter` |
| Demo | `GET/POST /api/demo-render`, which calls `/api/generate-interior` server-side |

Those routes call `enforceCredits` (`lib/usage/enforceCredits.ts`) and then consume a credit. Plans: intro is 40 credits for 7 days while status is `active` or `trialing`; Professional is soft-blocked at the monthly limit; Business is not blocked. Demo rows in `demo_access` are checked first. Missing service-role config fails closed.

`POST /api/render` is an older Replicate path that reads `users.credits`. The three studio pages do not call it. Leave it.

`/studio/projects` reads `lib/projects/get-projects.ts`, which returns **mock data**. `lib/projects/actions.ts` is a stub. SQL for `projects`, `project_renders`, and `prospect_mockups` does exist (`supabase/migrations/20250313100000_projects_share_and_prospect_mockups.sql`) with RLS. Do not wire that UI as part of conversion work.

`components/Studio/LatestRenders.tsx` is a presentational grid. It is not the history system.

### Gallery

`/gallery` server-renders static images plus `listPublishedRenders(48)` from `content_render_jobs` where `published = true` (`revalidate = 3600`). Unpublished rows are not returned. Presets for the content bot are `Concept` in `lib/content/concepts.ts` (pure data: `key`, `label`, `renderType`, scenes, slots). That is not a user-facing filter schema. Group 2's schema is new and must not treat unpublished jobs as public.

### Subscriptions and billing

`POST /api/stripe/checkout` requires a signed-in user, accepts `planId` of `intro` | `professional` | `business`, resolves the price with `getStripePriceId` (`lib/stripe/plans.ts`), and opens a Stripe Checkout **subscription** session. Success URL `/studio?billing=success`. Cancel URL `/onboarding?step=3&billing=cancel`. Optional body fields `src` and `rep` are copied into session metadata.

Price id env names (values stay in the host, not in git):

- Intro: `STRIPE_PRICE_INTRO_WEEKLY`
- Professional: `STRIPE_PRICE_PRO_MONTHLY`, fallback `NEXT_PUBLIC_STRIPE_PRICE_PRO`
- Business: `STRIPE_PRICE_BUSINESS_MONTHLY`, fallback `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS`

`app/api/stripe/webhook/route.ts` writes subscriptions, usage, and `intro_offer_claims`. `app/api/stripe/portal/route.ts` opens the customer portal.

Human Polish payments are a different Stripe session, created under `app/api/human-polish/**` and `lib/human-polish/stripe.ts`, with webhook secret `STRIPE_HP_WEBHOOK_SECRET` (not `STRIPE_WEBHOOK_SECRET`).

Onboarding Step 4 posts `{ planId }` to `/api/stripe/checkout`. `plan=starter` in the URL is dropped by `normalizePlanFromQuery`. Marketing CTAs currently link to `/onboarding?plan=starter`, so the intro plan is **not** preselected. New links use `onboardingPlanQuery()` from `lib/conversion/contracts.ts`, which returns `intro` for `starter`. Group 3 updates the existing links.

### Human Polish and contractor demo

Human Polish: marketing page `components/human-polish/marketing/HumanPolishPage.tsx`, intake `app/human-polish/intake`, pay `app/human-polish/pay/[requestId]`, admin `app/admin/human-polish`. Prices, file limits, and TTLs are `lib/human-polish/config.ts`. Email is Loops (`lib/human-polish/email.ts`), no-op when `LOOPS_API_KEY` is absent. Rate limits use Upstash and fail closed in production (`lib/human-polish/rate-limit.ts`).

Contractor demo: `app/contractor-demo/[city]/page.tsx`, city list `lib/contractor-demo/cities.ts`, events in `components/contractor-demo/analytics.ts`. Premium booking URL is `NEXT_PUBLIC_PREMIUM_BOOKING_URL` (`components/book-demo/BookDemoContent.tsx`). Empty string means the control has no destination; do not invent a URL.

### Feature flags

There is no flag service. The only runtime switch in middleware is the demo cookie. Human Polish behavior is constants plus env presence (missing secret → 503 or no-op, per `docs/VERCEL_DEPLOY.md`). Do not add a flag vendor. A new on/off switch is a server-read env name documented in the owning group's PR, defaulting to off, never `NEXT_PUBLIC_` if it hides a price.

### Cron

`vercel.json`:

- `/api/cron/human-polish-pack-expiration` at 15:00 UTC
- `/api/cron/content-renders` at 10:15 and 10:45 UTC

Both expect `CRON_SECRET`. Do not retune them.

## 13. Shared configuration and dependency contracts

| Contract | Source today | Implementation owner | Consumers |
| --- | --- | --- | --- |
| Self-serve display prices, credits, names, usage rights | `PLANS`, `usd`, `count`, `USAGE_RIGHTS`, `PROOF` in `lib/seo/facts.ts` | Group 3 publishes one catalog and points these call sites at it. Facts stay the SEO source until that catalog re-exports them. | All groups that show a price |
| Stripe price IDs | `lib/stripe/plans.ts` | Nobody changes IDs. Group 3 reads them. | Checkout |
| Checkout plan code | `intro` \| `professional` \| `business` | Group 3 | Group 7 onboarding, Group 4 offers |
| Marketing key → checkout code | `MARKETING_PLAN_TO_CHECKOUT` in `lib/conversion/contracts.ts` | Group 0 | Group 1, Group 3, Group 7 |
| Human Polish cents, discounts, delivery | `lib/human-polish/config.ts` | Unchanged. Group 5 reads availability only. | Human Polish UI |
| Gallery preset schema | Does not exist yet. Minimum ref type: `GalleryPresetRef`. | Group 2 | Group 1 if the homepage links to a preset |
| Published gallery read model | `GalleryRender` | Unchanged | Gallery pages, sitemap |
| Offer eligibility | `OfferEligibility` type only | Group 3 computes. Group 4 displays. | Group 1, Group 7 |
| Affiliate attribution and discount | Types only. Checkout `src` / `rep` metadata is the current hook. | Group 6 captures. Group 3 applies, using an existing Stripe promotion code id or none. | Checkout |
| Premium availability | Type only. Live hrefs: `/human-polish`, `/book-demo`. | Group 5 | Group 1, contractor demo (read-only) |
| New analytics | `trackConversionEvent` | Group 0 owns the helper. Each group owns its prefix. | All |
| New marketing classes | `marketingSurfaces` | Group 0 | Any new marketing component |

Env names a conversion change might touch (names only; values stay in Vercel):

- Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DOMAIN`, `NEXT_PUBLIC_PREMIUM_BOOKING_URL`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS`
- Server: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_INTRO_WEEKLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `SUPABASE_BOOK_DEMO_TABLE`, `CRON_SECRET`

Do not print these values, and do not log `user.email`, tokens, or full price ids. Checkout already logs some of that for debugging; do not add more.

Module-load rule (`docs/VERCEL_DEPLOY.md`): read secrets inside the handler. Missing config returns 503. Do not throw at import time.

Package manager is pnpm `10.25.0` (`package.json`). Runtime is Next.js 16, React 18, Tailwind 3.4, TypeScript 5. Path alias `@/*` → repo root.

## 14. Integration, rollback, and QA

### Branch and merge order

Base branch: `enhanced-studio-ui`. One branch per group. Merge in this order so later branches rebase on the contracts they call:

1. Group 0 — this spec and `lib/conversion/**` (no user-facing change).
2. In parallel after Group 0: Group 2 presets, Group 5 availability, Group 6 attribution module (no checkout edit yet).
3. Group 3 catalog, then the checkout hook that calls Group 6.
4. Group 4 offer UI, after Group 3 eligibility exists.
5. Group 1 marketing pages, after catalog, presets, offers, and availability.
6. Group 7 onboarding presentation last, after the plan-query fix.

Do not merge a group that edits `app/api/stripe/checkout/route.ts` while another branch also edits it. Only Group 3 does.

Rollback is a revert of that group's branch. Because Group 0 adds files and does not change pages, reverting a later group must not require reverting Group 0. Later groups should feature-gate behavior so a revert restores the previous page. Do not ship a migration that later groups need in order to boot.

### QA bar for every group

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm exec tsx --test` on any `*.test.ts` you add or touch, plus the existing node:test files if you touched their imports. There is no Jest/Vitest config and no `test` script. Tests use `node:test` via `tsx`. A header comment in each test file records the command (see `lib/content/describe.test.ts`).
- Do not deploy. Do not run a production cron.
- Prices shown in the diff match the catalog (after Group 3) or the current source named in §13 (before that).
- New events pass `isConversionEventName` and contain no PII.
- Desktop and a 390px-wide viewport for any page you change. Header still collapses at `lg`. Login modal still opens from the mobile sheet.
- Keyboard: the new control focuses, Escape closes dialogs, and the primary CTA is reachable.
- `prefers-reduced-motion` does not leave a new animation running.
- Studio interior, exterior, and landscape still post to the endpoints in §12. A conversion PR does not need to regenerate an image; it must not diff those handlers.

### Baseline (Group 0, this branch)

Re-run these on your own branch. Group 0 does not change a page.

- `pnpm exec tsc --noEmit` — passed.
- `pnpm exec tsx --test` on the existing `lib/**/*.test.ts` files plus `lib/conversion/*.test.ts` — 142 tests, 0 failures.
- `pnpm lint` (`next lint`) — fails. Next.js 16.1.0 has no `lint` command (`next --help` lists `build`, `dev`, `start`, `typegen`, and others). There is no `eslint` dependency and no ESLint config file. Do not add a lint stack inside a conversion PR to make this script pass.
- `pnpm exec next build` with no environment — fails while prerendering `/_not-found`. The root layout mounts `components/auth/AuthContext.tsx`, which calls `createClient()` in `lib/supabase/client.ts`, and that throws when `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset. This is existing behavior.
- The same build with those two public variables set to placeholders — compiled, typechecked, and generated all 67 static pages. `lib/human-polish/email.ts` logs that `LOOPS_API_KEY` is missing and continues; that no-op is intentional.
- Next.js also warns that the `middleware` file convention is deprecated in favor of `proxy`. Leave `middleware.ts` alone.

Production screenshots in the PR are a visual reference of the current brand, not a test of this branch.

## 15. Unresolved questions

These are real disagreements in the repo. Do not paper over them with a new constant.

1. Professional price is $99 in `lib/seo/facts.ts`, the homepage, `/pricing`, the intro modal, and the ROI labels, and $98 in onboarding Steps 3–4 and the contractor-demo plan section. Stripe is the authority. Group 3 confirms the live price id before changing any label.
2. Marketing links use `?plan=starter`. Onboarding ignores that value. Checkout's id is `intro`. The map in `lib/conversion/contracts.ts` is the fix for **new** links. Group 3 updates the existing ones.
3. `IntroPlanPromo` advertises code `NEW15` and a "Flash Launch Offer". No checkout path applies a coupon. Leave the component's behavior to Group 4; do not build a coupon around the string.
4. `lib/projects/get-projects.ts` is mock data while `projects` / `project_renders` tables and RLS exist. Studio project UI is not the conversion history model.
5. `POST /api/render` and `pages/api/generate.ts` are older generation paths. The live studio pages use the routes in §12.
6. `styles/globals.css` and `components/Header.tsx` ("Space Gen") are unused. They are not the brand source.
7. `text-muted-foreground` is `#8c8c8c` (Tailwind), while `--muted-foreground` in the dark CSS variables is a lighter slate. New muted text on marketing pages uses the utility, so it stays `#8c8c8c`.
8. No feature-flag service, no automated browser suite, and no GitHub Actions workflow are in the repo. `next lint` depends on whatever ESLint config Next resolves locally; do not add a new lint stack in a conversion PR unless lint is already failing for a reason you caused.
