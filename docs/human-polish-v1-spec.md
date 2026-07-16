# Human Polish™ V1 — Canonical Product & Implementation Specification

**Product:** Renderspace  
**Status:** Canonical V1 source of truth  
**Scope:** Product rules, customer journeys, copy guardrails, data and payment architecture, implementation sequence  
**Supersedes:** Any earlier Human Polish document where pricing, WhatsApp dependency, subscriber discounts, database architecture, checkout flow, turnaround, revisions, or package scope conflicts with this file.

---

## 1. Product Definition

### 1.1 Core positioning

> **Human Polish™ is your outsourced visualization department.**

Renderspace and Human Polish solve different parts of the same contractor workflow:

- **Renderspace:** rapid self-serve exploration, concept generation, and visual selling.
- **Human Polish:** professional execution by the Renderspace team when the customer wants the concepts produced for them or needs a more accurate presentation package.

A simple positioning line:

> **Use Renderspace to explore quickly. Use Human Polish when the project needs a real team behind it.**

Human Polish is not merely an AI-image editing service. It has two service families:

1. **AI Render Packs** — the Renderspace team generates batches of concepts from a detailed customer brief.
2. **Build-Ready Packages** — the Renderspace team turns an approved direction into professional 2D plans and, when purchased, human-produced photorealistic renderings.

### 1.2 Primary customer

The core buyer is a contractor, landscape contractor, outdoor-living company, design-build company, designer, developer, or similar professional who needs visual assets to:

- Present concepts to clients
- Sell projects with greater visual confidence
- Prepare HOA or design-review presentation packages
- Reduce internal design workload
- Produce a large number of concepts without personally prompting AI
- Turn an approved idea into a clear presentation package

Homeowners may purchase, but the public positioning remains contractor-first.

### 1.3 What Human Polish is not

Human Polish does **not** replace architects, engineers, surveyors, landscape architects, or permit professionals.

Human Polish does not provide:

- Architectural seals
- Engineering seals
- Structural calculations
- Civil engineering
- Code-compliance certification
- Permit drawings
- Construction documents
- Shop drawings
- Guaranteed HOA approval
- Guaranteed permit approval

Required public disclaimer:

> **Human Polish packages are intended for visualization, client presentation, and HOA/design-review support. They do not include architectural, structural, civil, or engineering services; professional seals; permit drawings; construction documents; or code-compliance certification.**

Approved HOA language:

- “HOA submission-ready presentation package”
- “Designed to support HOA and design-review submissions”
- “Human-produced plans and visuals based on the property survey, approved concept, and project information supplied by the customer”

Avoid:

- “Guaranteed HOA approval”
- “Permit-ready”
- “Stamped plans”
- “Construction-ready”
- “Replaces your architect”
- “100% accurate” as an unconditional claim

---

## 2. Service Architecture

## 2.1 Service Family A — AI Render Packs

AI Render Packs are done-for-you concept-generation packages.

The customer does not need to learn prompting, generate the images personally, or manage a freelancer. The customer completes a prescriptive intake. The Renderspace team interprets the brief, produces the concepts, and delivers an organized package.

### Standard packages

| Package | Standard price | First batch | Standard delivery target |
|---|---:|---:|---|
| 25 concepts | $399 | 5 concepts | 24–48 hours |
| 50 concepts | $699 | 10 concepts | 48–72 hours |
| 100 concepts | $1,199 | 15 concepts | 3–5 business days |

The delivery clock begins only after:

1. Payment has been completed; and
2. The Renderspace team confirms that all required files and instructions are complete and usable.

### First-purchase promotion

- The first 25-render purchase is offered at **$349**.
- Eligibility is determined server-side using a normalized phone number.
- A prior paid or completed AI Render Pack purchase using the same normalized phone number makes the customer ineligible.
- The first-purchase promotion applies only to the 25-render pack.
- The page should show this promotion in a bold, high-visibility promotional box or modal.
- The promotion must never be represented as permanent if it is intended to drive first-purchase action.

### Subscriber discount

- Active Renderspace Professional and Business subscribers receive **15% off AI Render Packs**.
- The owner accepts that the discounted 100-pack may fall modestly below the earlier 48% margin floor in exchange for increased AOV.
- For V1, subscriber eligibility must be verified through an authenticated Renderspace session.
- A guest may complete checkout without creating an account, but must sign in to claim the subscriber discount.
- Do not trust an email address typed into the intake as proof of subscription status.

Subscriber prices before tax:

| Package | 15% subscriber price |
|---|---:|
| 25 concepts | $339.15 |
| 50 concepts | $594.15 |
| 100 concepts | $1,019.15 |

### Discount policy

Discounts never stack.

At checkout, apply the single best eligible offer:

- 25-pack first-purchase price: $349
- 25-pack subscriber price: $339.15
- Eligible subscriber receives the lower subscriber price, not both reductions
- 50- and 100-pack buyers receive the subscriber discount when eligible
- Tax is calculated separately by Stripe Tax

### Quantity and multiple-pack rule

- Exactly one pack may be purchased per checkout in V1.
- The customer cannot increase quantity in Stripe Checkout.
- A customer needing multiple packs, ongoing production, or a special volume arrangement should be directed to:
  - a short team call;
  - email; or
  - a manual WhatsApp conversation.
- WhatsApp is an assisted-sales option in V1, not an automated bot dependency.

### Project and property rule

The standard pack covers:

> **One project at one property.**

A second property may be approved after a brief call only when both properties share substantially the same design objective and can be fulfilled as one coherent production cycle.

Otherwise, separate properties require separate pack purchases.

### Project categories

Human Polish is not limited to the contractor-demo niche. The intake may support:

- Landscape / outdoor living
- Exterior / home
- Interior
- Pool
- Commercial / large property
- Other / custom

Commercial, unusually large, multi-phase, or nonstandard requests may be routed to manual review or custom pricing.

### Pack expiration

- AI Render Packs must be used within **90 days** of purchase.
- The expiration and its start date must be visible before checkout.
- The order summary and acknowledgment step must state the 90-day use period.

### Deliverables

Each delivered render equals **one design concept**.

The customer receives:

- High-resolution PNG files
- 1080p output as the minimum V1 standard
  - Default landscape target: at least 1920 × 1080 pixels
  - Other aspect ratios should provide an equivalent 1080p-quality output
- An organized PDF containing the concepts
- Contractor/company branding on the PDF when requested
- Commercial usage for:
  - client presentations;
  - proposals;
  - mailers;
  - ads;
  - social media;
  - websites; and
  - sales collateral

The customer does not receive editable source files unless separately agreed.

### Branding options

The intake should ask whether the PDF should be branded.

When branding is requested, collect:

- Company name
- Logo
- Phone number
- Website
- Optional brand notes
- Project title

### Revisions and guarantee

AI Render Packs do not include open-ended revision rounds.

Instead, use a bounded risk-reversal policy:

#### First-Batch Brief-Match Guarantee

> Renderspace produces the first 5, 10, or 15 concepts before completing the remaining pack. If that first batch materially fails to follow the written brief the customer approved, the customer may notify Renderspace within 24 hours. Renderspace will correct the direction once at no additional charge before producing the remaining concepts.

The guarantee covers failure to follow the approved written brief.

It does not cover:

- A new property
- A new design direction
- New client requirements introduced after approval
- A change of mind
- New must-have features not included in the approved brief
- Additional variations beyond the purchased pack

#### Unusable-file protection

If the submitted files cannot reasonably support the requested work:

1. The order is paused.
2. Renderspace requests replacement or additional files.
3. The delivery clock does not begin until files are accepted.
4. If fulfillment remains impossible before production begins, Renderspace may cancel and refund the order rather than deliver unusable work.

#### Rush-fee guarantee

If Renderspace explicitly accepts a guaranteed rush order and misses the approved deadline for reasons within Renderspace’s control, the rush fee is refunded.

The base package payment is not refunded solely because the rush deadline was missed if the work remains deliverable.

### Rush options

| Package | Rush option |
|---|---|
| 25 concepts | Guaranteed 24-hour delivery for $79, subject to manual approval |
| 50 concepts | Guaranteed 48-hour delivery for $79, subject to manual approval |
| 100 concepts | Contact team for expedited review and custom rush terms |

Rush cannot be promised automatically.

If a customer selects a rush request:

- Create or update the draft request.
- Collect the required files and deadline.
- Route the request to human approval.
- Do not charge the rush line item until capacity is approved.
- Standard checkout remains available if the customer removes the rush request.

---

## 2.2 Service Family B — Build-Ready Packages

Build-Ready Packages begin with an approved concept and produce professional presentation materials based on the files and information supplied by the customer.

All Build-Ready requests require human review before payment and production.

The public flow is:

```text
Select package
→ Complete detailed intake
→ Upload survey, site photos, and project references
→ Human scope review
→ Standard-package approval or custom quote
→ Stripe Checkout
→ Production
```

### Essentials 2D — $599

Includes:

- Site map
- Hardscape plan
- Conceptual material list or material legend
- Property survey integration
- Selected rendering(s) included in the presentation package
- Two combined revision rounds
- Delivery target: 3–5 business days after complete-file acceptance and payment

Minimum required intake materials:

- Property survey
- Clear site photo(s)
- Inspiration image or approved concept

The Renderspace team may request additional dimensions, notes, or supporting files after review.

### Essentials 3D — $899

Includes everything in Essentials 2D, plus:

- Three guaranteed human-produced photorealistic views
- Up to two additional supporting/detail views when the project scope allows
- Geometry refinement
- Material refinement
- Lighting refinement
- Planting refinement
- Three combined revision rounds across the 2D and 3D package
- Delivery target: 5–10 business days after complete-file acceptance and payment

“Up to two additional views” is discretionary and is not guaranteed when project complexity, available information, or production scope does not support them.

### Custom projects

Use the same intake route with:

```text
package=custom
```

Custom review applies to:

- Commercial projects
- Estates or large acreage
- Multi-phase projects
- Multiple structures
- Complex grading or civil conditions
- Unusually large hardscape scopes
- Multiple properties
- Unusual deliverable requirements
- Requests that resemble permit, architectural, structural, engineering, or construction-document work

Custom pricing is manually quoted.

### Revision definition

A revision refines the approved direction.

A revision may include reasonable changes to:

- Materials
- Planting selections
- Layout details
- Labels
- Presentation formatting
- Minor geometry
- Rendering details

A new design direction, substantial scope change, or replacement concept is not a revision and may require a new package or custom fee.

### Accuracy and responsibility statement

Build-Ready output is based on:

- The customer’s survey
- Customer-provided photos
- The approved concept
- Customer-provided dimensions and specifications
- Information available during the review

Public copy should say:

> “Human-produced plans and visuals based on the approved concept and project information you provide.”

Do not provide unconditional accuracy guarantees.

---

## 3. Primary Customer Journeys

## 3.1 AI Render Pack — direct transaction

```text
/human-polish
→ Select 25, 50, or 100
→ /human-polish/intake?family=ai-render-pack&package={25|50|100}
→ Create draft request
→ Complete prescriptive interactive intake
→ Upload private files
→ Review expectations and deliverables
→ Accept required acknowledgments
→ Review complete order summary
→ Resolve standard vs. approved rush path
→ Guest Stripe Checkout with Stripe Tax
→ /human-polish/success?session_id=...
→ Payment and intake confirmation emails
→ Team accepts files
→ Delivery clock begins
→ First batch
→ Remaining concepts
→ Final PNG + PDF delivery
```

Package selection is locked inside the intake.

To change packages, the customer returns to `/human-polish` and starts the selected package flow.

## 3.2 Build-Ready — review-first transaction

```text
/human-polish
→ Select Essentials 2D, Essentials 3D, or Custom
→ /human-polish/intake?family=build-ready&package={essentials-2d|essentials-3d|custom}
→ Create draft request
→ Complete Build-Ready intake
→ Upload private files
→ Accept scope acknowledgment
→ Submit for review
→ Team approves standard package or creates custom quote
→ Payment request is sent
→ Stripe Checkout
→ Production
```

## 3.3 Call and WhatsApp escape hatch

Every long or high-friction part of the intake should offer a visible alternative:

> “Prefer to talk it through? Request a quick call or message us on WhatsApp.”

Use a manual link or short request form in V1.

Do not build a WhatsApp state machine, session table, or Twilio bot for launch.

---

## 4. Interactive Intake Wizard

The intake form is the operational replacement for the planned WhatsApp questionnaire. It must feel like a guided design interview, not a generic contact form.

## 4.1 General behavior

- Guest accessible
- Mobile responsive
- Prescriptive, step-by-step interaction
- One primary question group per step
- Clear progress indicator
- Back and continue controls
- Create a draft request before private uploads begin
- Save draft progress for 15 minutes
- Restore the draft during that recovery window
- Package selection is passed by URL and locked
- A call/WhatsApp option remains visible
- Validate each step before continuation
- Preserve data after recoverable errors
- Show a full summary before checkout or submission

## 4.2 Suggested wizard steps

### Step 1 — Contact and business information

Required:

- Full name
- Email
- Phone number
- Company name
- Role:
  - Contractor
  - Designer
  - Homeowner
  - Developer
  - Other
- Preferred contact:
  - Phone
  - Email
  - WhatsApp

Phone numbers must be normalized server-side for first-purchase eligibility checks.

### Step 2 — Project basics

Collect:

- Project type
- Project name
- Property address or city/state
- Project description
- Client budget band
- Presentation/estimate deadline
- Whether the request is standard or a rush request
- Whether an approved concept already exists

### Step 3 — Property and scope rule

State:

> A standard pack covers one project at one property.

Ask:

- Is this for one property?
- Are you trying to cover a second property with the same design objective?

If a second property is selected:

- Do not silently include it.
- Route to a short call or human review.
- Explain that separate properties typically require separate packs.

### Step 4 — Private file upload

Accepted file types:

- JPEG
- PNG
- PDF

File categories:

- Site photos
- Property survey
- Inspiration images
- Plant references
- HOA guidelines
- Existing plans
- Approved concepts
- Company logo
- Other supporting document

V1 upload limits:

- Maximum 25 files
- Maximum 25 MB per file
- Maximum 250 MB total per request

Files must be stored in a private Supabase Storage bucket.

Do not use public URLs.

### Step 5 — Prescriptive design interview

Use open-ended prompts rather than mandatory style presets.

Ask:

- “Describe what the client wants this space to become.”
- “What elements must appear in every concept?”
- “What should we avoid?”
- “Which plants, materials, colors, finishes, or features should we prioritize?”
- “Should the concepts lean practical, premium, experimental, or mixed?”
- “What did the client ask for in their own words?”
- “What would make the first batch feel successful to you?”

The customer may type naturally. They should not be expected to understand prompt engineering.

### Step 6 — Delivery and branding

Collect:

- Standard delivery or rush request
- Branding requested: yes/no
- Logo
- Company phone
- Website
- Brand notes
- PDF/project title

For rush requests, explain:

> Rush delivery is confirmed only after the Renderspace team verifies capacity and file usability.

### Step 7 — Expectations and required acknowledgments

Show a package-specific statement.

AI Render Pack example:

> Your package includes [25/50/100] conceptual design renders, delivered as high-resolution PNG files and an organized PDF. The PDF can carry your company branding. Your first batch contains [5/10/15] concepts so we can confirm that the approved brief was followed before completing the remainder.

Required checkboxes:

- I have permission to submit these property photos and project documents.
- I understand these are conceptual and presentation renderings, not construction, architectural, engineering, structural, or permit documents.
- I understand the delivery clock begins only after Renderspace confirms that my files and instructions are complete and usable.
- I understand a new property, new design direction, or new client request is not a correction under the First-Batch Brief-Match Guarantee.
- I understand this pack must be used within 90 days.
- I agree to the applicable terms and privacy policy.

Optional, separate permission:

- Renderspace may contact me later to request permission to feature this work.

Do not bundle marketing-use permission into required purchase consent.

### Step 8 — Order summary

Show:

- Selected package
- Number of concepts
- Project/property scope
- First-batch size
- Standard turnaround
- Rush status
- Branding selection
- Standard price
- Best eligible promotion
- Subscriber discount status
- Tax treatment
- Total before Stripe Tax
- Guarantee summary
- 90-day expiration
- Scope exclusions
- Delivery-clock rule

Primary action:

> **Continue to Secure Checkout**

For Build-Ready:

> **Submit for Scope Review**

---

## 5. Checkout, Pricing, and Payment Rules

## 5.1 Guest checkout

AI Render Pack checkout is guest accessible.

Stripe Checkout should collect:

- Customer email
- Customer phone number
- Customer name
- Billing address
- Company name where supported
- Payment information
- Tax information required by Stripe Tax

The intake remains the authoritative source for project information.

## 5.2 Stripe architecture

The current Renderspace subscription checkout remains subscription-only.

Create a separate Human Polish route:

```text
POST /api/human-polish/checkout
```

Use:

```text
mode: "payment"
```

Required Stripe metadata:

- `productType: "human_polish"`
- `requestId`
- `family`
- `package`
- `phoneNormalized`
- `promotionType`
- `subscriberDiscountApplied`
- `rushApproved`
- `leadSource`

Extend the existing Stripe webhook rather than creating a second Stripe webhook.

The Human Polish webhook branch must be guarded by:

- `session.mode === "payment"`
- `metadata.productType === "human_polish"`

Human Polish purchases must never update:

- Renderspace subscription status
- `current_plan`
- subscription credits
- subscription lifecycle records

## 5.3 Checkout eligibility

### AI Render Packs

Standard-delivery orders can proceed directly to Stripe after:

- Intake completion
- Required files uploaded
- Acknowledgments accepted
- Order summary confirmed

File usability is reviewed after payment. The customer is protected by the unusable-file policy.

Rush requests require manual approval before the rush fee and guaranteed deadline are charged.

### Build-Ready

Build-Ready does not proceed directly to checkout.

It requires:

- Intake submission
- File review
- Scope approval
- Approved package and price
- Payment request

## 5.4 Tax

Enable Stripe Tax for applicable Human Polish one-time purchases.

Tax is not included in displayed package prices unless the page explicitly says otherwise.

## 5.5 Checkout return routes

Success:

```text
/human-polish/success?session_id={CHECKOUT_SESSION_ID}
```

Cancellation:

```text
/human-polish
```

The cancelled intake remains stored so the team can follow up or the customer can return through a recovery link.

---

## 6. Success Page and Milestone Communication

## 6.1 Success page

The Human Polish success page should display:

- Payment received
- Intake received
- Package purchased
- Request/order reference
- Reminder that the delivery clock begins after file acceptance
- Expected next review/start communication
- Support email
- Call/WhatsApp link
- Next-step summary

Do not imply production has started until files are accepted.

## 6.2 Loops milestone emails

Use the existing Loops integration.

Required V1 communication events:

1. Draft/intake received
2. Payment received
3. Files need replacement or more information
4. Files accepted and delivery clock started
5. Rush request approved
6. Rush request not available, with standard-delivery option
7. First batch ready
8. Final delivery ready
9. Build-Ready scope approved
10. Build-Ready custom quote or more-information request
11. Build-Ready payment requested
12. Revision request received
13. Final completion
14. Rights/case-study permission request
15. Pack expiration reminder

Internal alerts should go to:

- `frank@renderspace.ai`

---

## 7. Data and Storage Architecture

## 7.1 Core tables

### `human_polish_requests`

One record per intake/order.

Recommended fields:

- `id`
- `user_id` nullable
- `draft_token_hash`
- `draft_expires_at`
- `contact_name`
- `contact_email`
- `contact_phone`
- `phone_normalized`
- `company_name`
- `customer_role`
- `preferred_contact_method`
- `family`
- `requested_package`
- `approved_package`
- `intake_method`
- `lead_source`
- `project_type`
- `project_name`
- `project_address`
- `project_city`
- `project_state`
- `brief_text`
- `design_objectives`
- `must_have_elements`
- `avoid_elements`
- `material_preferences`
- `client_words`
- `success_definition`
- `deadline_date`
- `budget_band`
- `has_approved_concept`
- `has_property_survey`
- `second_property_requested`
- `branding_requested`
- `brand_phone`
- `brand_website`
- `brand_notes`
- `rush_requested`
- `rush_approved`
- `scope_confirmed`
- `scope_confirmed_at`
- `terms_accepted_at`
- `marketing_permission`
- `manual_quote_required`
- `status`
- `standard_amount`
- `discount_amount`
- `quoted_amount`
- `currency`
- `promotion_type`
- `subscriber_discount_applied`
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `stripe_customer_id`
- `payment_status`
- `files_accepted_at`
- `delivery_clock_started_at`
- `assigned_to`
- `revision_count`
- `first_batch_delivered_at`
- `final_delivered_at`
- `rights_request_sent`
- `rights_permission_granted`
- `created_at`
- `updated_at`

Recommended minimum statuses:

- `draft`
- `submitted`
- `needs_information`
- `under_review`
- `rush_review`
- `ready_for_payment`
- `awaiting_payment`
- `paid`
- `files_accepted`
- `assigned`
- `in_progress`
- `first_batch_ready`
- `first_batch_delivered`
- `ready_for_review`
- `delivered`
- `revision_requested`
- `completed`
- `cancelled`
- `expired`

### `human_polish_files`

One row per uploaded file.

Recommended fields:

- `id`
- `request_id`
- `bucket_name`
- `object_path`
- `file_type`
- `original_filename`
- `mime_type`
- `size_bytes`
- `created_at`

### Optional later table: `human_polish_events`

Do not require it for initial launch. Add only when a durable event timeline is needed beyond milestone emails and status timestamps.

## 7.2 Private storage

Create one private Supabase bucket:

```text
human-polish-uploads
```

Requirements:

- `public = false`
- No public read policy
- No anonymous direct listing
- No `getPublicUrl`
- Upload through server-controlled signed upload URLs or an equivalent server-authorized mechanism
- Staff downloads use short-lived signed URLs
- Store the object path, not a permanent public URL

Suggested object path:

```text
{request_id}/{file_type}/{uuid}-{sanitized_filename}
```

## 7.3 RLS and security

- Enable RLS on Human Polish tables.
- Public/guest intake writes through server API routes using the service-role client.
- Never expose the service-role key to browser code.
- Do not provide anonymous public table reads.
- Draft recovery must use a random, unguessable token stored as a hash.
- Draft recovery expires after 15 minutes.
- Validate MIME type, extension, file count, per-file size, and total request size server-side.
- Normalize and validate phone numbers server-side.
- Rate-limit draft creation, uploads, and checkout initiation.
- Do not accept package price, discount, rush approval, or tax amount from the browser as authoritative.

---

## 8. Marketing Page and Copy Architecture

## 8.1 Route

```text
/human-polish
```

Primary headline:

> **Your Outsourced Visualization Department**

Primary service order:

1. AI Render Packs
2. Build-Ready Packages
3. Custom work
4. Call/WhatsApp support

## 8.2 Core page sections

1. Hero
2. Service-family fork
3. AI Render Packs and first-purchase promotion
4. How the interactive intake works
5. Pack pricing
6. “I can do this myself with ChatGPT” objection handling
7. Real Renderspace-produced work
8. Build-Ready package explanation
9. Build-Ready pricing
10. HOA/design-review support
11. Scope expectations
12. Turnaround/capacity section
13. Guarantee section
14. Final CTA
15. Call/WhatsApp assisted-sales option

## 8.3 Main objection

The leading objection is:

> “I can do this myself with ChatGPT.”

Approved response themes:

- The buyer is paying to avoid spending nights prompting, sorting, correcting, and organizing concepts.
- Human Polish gives the customer a prescriptive brief, a real production team, organized deliverables, and a defined first-batch process.
- Generic AI tools can produce an image; Human Polish manages a deliverable.
- The buyer is purchasing time, throughput, organization, and human accountability.
- Renderspace can still be used for self-serve exploration when the customer wants to do it personally.

Avoid attacking or mocking ChatGPT. Position Human Polish as the done-for-you alternative.

## 8.4 Proof

The page may show:

- Real renderings created by the Renderspace team
- Work created by Renderspace employees through previous ventures when the ownership and usage rights are valid
- Existing Renderspace testimonials as proof of the visualization model, with transparent framing
- Before/after work
- Organized PDF examples
- Branded deliverable examples

Do not imply a customer purchased a specific Human Polish package unless that is true.

## 8.5 Scarcity

Scarcity must be based on real production capacity and delivery-date availability.

Approved language:

- “Rush availability is confirmed before we promise the date.”
- “Delivery dates are accepted based on current production capacity.”
- “If your presentation date is fixed, submit the intake early or request a quick capacity check.”

Avoid:

- Fake countdowns
- False city exclusivity
- Invented capacity numbers
- “Only three spots left” unless operationally true

---

## 9. Site Navigation

Add the label:

> **Human Polish™**

to:

- Homepage marketing navigation
- Gallery navigation
- Pricing navigation
- FAQ navigation
- Mockup Method navigation
- Contractor Demo navigation
- Book Demo navigation
- Other public marketing headers
- Authenticated app/studio navigation

The repository currently duplicates marketing headers across pages.

For V1:

- Update each existing header explicitly.
- Maintain a checklist of modified navigation files.
- Do not refactor the entire site into a new global header during the Human Polish launch.
- Preserve existing page behavior and styling.
- Link to `/human-polish`.

---

## 10. Analytics

Track at minimum:

- `viewed_human_polish`
- `selected_service_family`
- `selected_render_pack`
- `clicked_build_ready`
- `clicked_custom_quote`
- `started_intake`
- `created_intake_draft`
- `uploaded_files`
- `completed_intake`
- `accepted_scope`
- `viewed_order_summary`
- `requested_rush`
- `requested_call`
- `clicked_whatsapp`
- `initiated_checkout`
- `completed_checkout`
- `checkout_cancelled`
- `first_purchase_promo_viewed`
- `first_purchase_promo_applied`
- `subscriber_discount_applied`

Do not send personally identifying information to GA.

---

## 11. Internal Admin Dashboard

The internal admin dashboard has priority over a customer-facing status portal.

Suggested route:

```text
/admin/human-polish
```

It must be protected using the existing authentication model plus an explicit admin authorization rule.

V1 dashboard requirements:

- List and filter requests
- View customer and company
- View preferred contact method
- View package
- View pricing/promotion
- View payment state
- View uploaded files through signed URLs
- Mark files usable or request replacements
- Approve/reject rush
- Record delivery-clock start
- Assign a designer
- Update status
- Record first-batch delivery
- Record final delivery
- Record revision count
- Record rights permission
- Copy/export data for Trello or Asana

Detailed freelancer task management remains in Trello or Asana.

Do not build a customer-facing order portal before the internal workflow is proven.

---

## 12. V1 Implementation Roadmap

### Phase 0 — Canonical specification

- Commit this file to `/docs/human-polish-v1-spec.md`.
- Mark earlier Human Polish documents as superseded where they conflict.
- Create shared types and constants only after repository recon confirms naming.

### Phase 1 — Shared contract, schema, and private storage

- Create canonical TypeScript enums/types for:
  - service family;
  - package;
  - status;
  - file type;
  - promotion type;
  - pricing.
- Create the `human_polish_requests` migration.
- Create the `human_polish_files` migration.
- Create the private `human-polish-uploads` bucket.
- Implement secure draft creation and 15-minute recovery.
- Implement signed/private upload architecture.

### Phase 2 — Interactive intake wizard

- Create `/human-polish/intake`.
- Implement pack-locked URL handling.
- Build the prescriptive wizard.
- Add call/WhatsApp escape hatches.
- Add acknowledgments.
- Add package summary.
- Add Build-Ready review submission behavior.
- Add standard Render Pack checkout readiness.

### Phase 3 — AI Render Pack Stripe checkout

- Create Stripe products/prices.
- Create `/api/human-polish/checkout`.
- Support guest one-time checkout.
- Enable Stripe Tax.
- Implement first-purchase phone eligibility.
- Implement authenticated subscriber discount.
- Prevent discount stacking.
- Enforce one pack per checkout.
- Add approved rush line item.
- Create success route.
- Extend the existing Stripe webhook with a guarded Human Polish payment branch.

### Phase 4 — Milestone emails

- Implement Loops events/templates.
- Send internal alerts to `frank@renderspace.ai`.
- Test every milestone in a nonproduction environment.

### Phase 5 — Marketing page and navigation

- Build `/human-polish`.
- Reuse existing Renderspace design patterns.
- Add Human Polish™ to public and authenticated navigation without a global header refactor.
- Add GA events.

### Phase 6 — Build-Ready approval and payment

- Add manual scope review.
- Add Essentials 2D and Essentials 3D approved payment flow.
- Add custom quotes.
- Add revision tracking.

### Phase 7 — Internal admin dashboard

- Build the protected operations dashboard.
- Add file review, rush approval, assignment, status, and delivery controls.

### Phase 8 — Delivery and rights flywheel

- Add final delivery records.
- Add case-study/rights requests.
- Add repeat-order CTA.
- Add pack-expiration reminders.
- Add subscription bridge.

### Deferred

Do not include in V1 unless separately approved:

- Automated WhatsApp bot
- Twilio state machine
- Slack workflow
- Customer order-status portal
- Automated freelancer assignment
- Full project-management system
- Global marketing-header refactor
- Unlimited revisions
- Direct self-checkout for unreviewed Build-Ready work

---

## 13. Parallel Agent File-Ownership Plan

Parallel work begins only after the canonical spec and shared contract branch are committed.

### Foundation Agent

Owns:

- `/docs/human-polish-v1-spec.md`
- `lib/human-polish/types.ts`
- `lib/human-polish/config.ts`
- Supabase migrations
- storage SQL/setup documentation
- draft/request API contract

Must not build marketing UI, Stripe checkout, or nav.

### Intake Agent

Owns:

- `app/human-polish/intake/**`
- `components/human-polish/intake/**`
- client-side intake state
- wizard UI
- order summary UI
- intake API calls

Uses the Foundation Agent’s committed types and API contract.

Must not modify Stripe webhook, marketing headers, or migrations.

### Stripe Agent

Owns:

- `app/api/human-polish/checkout/**`
- `lib/stripe/humanPolishProducts.ts`
- guarded Human Polish branch in the existing Stripe webhook
- success route payment verification
- Stripe Tax and discount logic

Must not modify subscription behavior, studio credits, or intake UI beyond documented interfaces.

### Marketing Agent

Owns:

- `app/human-polish/page.tsx`
- `components/human-polish/marketing/**`
- Human Polish analytics helper
- proof and pricing presentation

Must not modify API routes, migrations, Stripe webhook, or intake logic.

### Navigation Agent

Owns only the explicit marketing/app navigation files found in recon.

Must:

- add Human Polish™ consistently;
- preserve existing styles and behavior;
- avoid header refactoring.

### Email Agent

Owns:

- Human Polish Loops event helpers
- email-template/event mapping
- internal email alert helper

Must not modify intake or checkout logic except through documented helper calls.

### Admin Agent

Begins after the request schema and status transitions are stable.

Owns:

- `/admin/human-polish/**`
- admin-only server actions/routes
- signed staff file access

Must not change public intake or checkout behavior.

### Integration / QA Agent

Starts after workstream branches are ready.

Owns no feature area initially.

Responsibilities:

- Merge/rebase review
- Resolve conflicts deliberately
- Run typecheck, lint, build, and route tests
- Test subscription checkout for regressions
- Test Render Pack guest checkout
- Test private uploads
- Test first-purchase and subscriber pricing
- Test navigation
- Test mobile intake
- Verify no public file exposure
- Produce a release checklist

---

## 14. Launch Acceptance Criteria

Human Polish V1 is deployable only when:

- `/human-polish` is live and brand-consistent.
- Human Polish™ appears in required navigation locations.
- A guest can select a Render Pack and complete the intake.
- The package cannot be altered maliciously from browser payloads.
- Draft recovery works for 15 minutes.
- Files upload privately.
- No Human Polish file has a public URL.
- The intake shows all required acknowledgments.
- The order summary matches server-authoritative pricing.
- First-purchase eligibility uses normalized phone history.
- Subscriber discount requires authenticated active subscription.
- Discounts do not stack.
- One pack is enforced per checkout.
- Stripe Tax is enabled.
- Standard AI Render Pack checkout succeeds.
- Rush cannot be guaranteed without approval.
- Human Polish `mode=payment` webhook processing does not modify subscriptions.
- Success and cancellation routes work.
- Loops sends intake/payment/file-acceptance emails.
- Frank receives internal alerts.
- Build-Ready requests submit for review rather than immediate payment.
- Essentials 2D and 3D copy includes clear scope limitations.
- The site does not promise permit documents, sealed plans, or guaranteed HOA approval.
- GA events fire without PII.
- Existing homepage, pricing, studio, subscription checkout, onboarding, contractor-demo, and book-demo behavior remains intact.
- Production build succeeds.
- A complete test order succeeds in Stripe test mode before production prices are enabled.

---

## 15. Final Product Summary

> **Human Polish™ is Renderspace’s outsourced visualization department.**

AI Render Packs remove the creative-production burden: the customer provides a detailed brief, Renderspace generates 25, 50, or 100 concepts, and the customer receives organized PNG and PDF deliverables.

Build-Ready Packages remove the presentation-production burden: the customer provides an approved concept and project files, and Renderspace produces professional plans and human-made visualizations designed to support client and HOA/design-review presentations.

Renderspace remains the rapid self-serve engine.

Human Polish is the professional service layer for customers who want the work done for them or need a more carefully produced presentation package.
