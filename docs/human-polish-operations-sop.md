# Human Polish™ — Operations SOP (V1)

**Audience:** Frank (initial operator) → future project manager  
**Canonical product rules:** `docs/human-polish-v1-spec.md`  
**Status vocabulary:** `lib/human-polish/types.ts` (`HUMAN_POLISH_STATUSES`)  
**Pricing / targets:** `lib/human-polish/config.ts`  
**Admin surface (parallel build):** `/admin/human-polish`

> This SOP is operational guidance. It does not change product policy. Where the
> specification is silent, items are marked **OWNER DECISION REQUIRED**.

---

## 0. Operating principles

1. **One pack / package per checkout** — one project at **one property** unless a second property is explicitly approved after a call.
2. **Delivery clock ≠ payment time.** The clock starts only after payment **and** files/instructions are accepted as complete and usable (`files_accepted` + `files_accepted_at` / `delivery_clock_started_at`).
3. **Rush is never automatic.** Capacity and file usability must be approved before rush timing or rush fee is confirmed.
4. **AI Render Packs ≠ open-ended revisions.** Use the First-Batch Brief-Match Guarantee only.
5. **Build-Ready ≠ permits / seals / construction documents.** Presentation and HOA/design-review support only.
6. **Do not invent WhatsApp numbers** in customer messages. Use approved contact paths (email reply, `frank@renderspace.ai`, and any assisted-sales link already configured in product).
7. **Never share** recovery tokens, service-role keys, Stripe secrets, permanent storage paths, or unnecessary payment details with freelancers or external tools beyond what the job requires.

---

## 1. Where work appears

| Source | What to watch |
|---|---|
| Internal Loops alert (`internal_alert`) | New intake / paid order summaries → `frank@renderspace.ai` (or `LOOPS_HP_INTERNAL_ALERT_EMAIL`) |
| Admin dashboard | `/admin/human-polish` request list and detail (once launched) |
| Status filter priorities | `submitted`, `under_review`, `rush_review`, `needs_information`, `paid`, `ready_for_payment`, `awaiting_payment` |

**OWNER DECISION REQUIRED:** Exact Trello/Asana board names, columns, and SLA timers after Admin launch.

---

## A. New intake received

### A.1 Where the request appears

1. Internal alert email (subject/summary from server).
2. Admin list filtered to new/submitted/under_review (and Build-Ready review queue).

### A.2 Initial information to review

From the request record (Admin detail):

- Request reference (`requestId` / request id)
- Service family: `AI Render Packs` vs `Build-Ready Packages`
- Package: `25` / `50` / `100` / `essentials-2d` / `essentials-3d` / `custom`
- Project type, project name, city/state or address
- Brief / must-haves / avoid / success definition
- Deadline date and rush flags (`rush_requested`, `rush_approved`)
- Second-property flag (`second_property_requested`)
- Branding requested + brand fields
- Payment status and amounts
- Current `status`
- Uploaded file inventory by `file_type`

### A.3 Contact information verification

Check:

- Contact name, email, phone, company, role, preferred contact method
- Email looks deliverable; phone present for first-purchase eligibility history (server already normalized)
- Preferred contact: phone / email / WhatsApp — respond on the preferred channel when practical; keep written decisions in email/Admin notes

If contact data is incomplete or bounced: set `needs_information` and send **files need info** / contact-correction outreach. Do not start production.

### A.4 Package verification

| Family | Confirm |
|---|---|
| AI Render Pack | Package matches paid Stripe metadata; one pack only; not mixed with Build-Ready |
| Build-Ready | Package is Essentials 2D, Essentials 3D, or Custom; **no production until scope approval + payment** |

Mismatch between intake package and payment metadata → **OWNER DECISION REQUIRED** (do not silently reprice).

### A.5 Payment verification

| Situation | Expected payment state |
|---|---|
| AI Render Pack after Checkout | `payment_status` = `paid`; status typically `paid` |
| Build-Ready just submitted | Unpaid / awaiting review (`submitted` → `under_review` / `ready_for_payment` / `awaiting_payment`) |
| Refunded / cancelled | Do not produce; follow refund path |

Confirm amount against server config (see § pricing below), promotion type (`none` / `first_purchase_25` / `subscriber_15`), and that discounts did not stack.

### A.6 Deadline verification

- Read customer `deadline_date` and notes.
- Separate **customer presentation deadline** from **package delivery target**.
- If deadline is tighter than standard targets, treat as rush path (manual approval) — do not promise timing in chat without approval.

Standard AI Render Pack targets (after file acceptance):

| Package | Target |
|---|---|
| 25 concepts | 24–48 hours |
| 50 concepts | 48–72 hours |
| 100 concepts | 3–5 business days |

Build-Ready targets (after file acceptance **and** payment):

| Package | Target |
|---|---|
| Essentials 2D | 3–5 business days |
| Essentials 3D | 5–10 business days |

### A.7 Rush-request identification

- `rush_requested` true → queue `rush_review` (or equivalent Admin rush queue).
- Do **not** charge or confirm rush until capacity + files allow approval.
- 25-pack rush: Guaranteed 24-hour delivery for **$79** (manual approval).
- 50-pack rush: Guaranteed 48-hour delivery for **$79** (manual approval).
- 100-pack: **Contact team for custom rush terms** — no auto $79 path in config.

### A.8 Second-property or custom-scope detection

Flag for call / human review when:

- `second_property_requested` is true
- `project_type` = `commercial_large_property` or `other_custom`
- Package = `custom`
- Multi-phase, multi-structure, or permit/sealed-plan language in the brief
- Scope clearly exceeds one coherent production cycle

Action: pause automatic production assumptions; convert to call or custom quote as appropriate. Do **not** silently include a second property in a standard pack.

---

## B. File usability review

### B.1 Checklist

| Item | AI Render Pack | Build-Ready Essentials | Notes |
|---|---|---|---|
| Required site photos | Required | Required | Clear, usable angles of the work area |
| Survey availability | Helpful; may be required for accuracy claims | **Required** for Essentials | PDF preferred |
| Inspiration files | Strongly preferred | Inspiration **or** approved concept | |
| Existing plans | If referenced in brief | If referenced | |
| HOA guidelines | If HOA presentation is a goal | If HOA presentation is a goal | Do not promise approval |
| Image quality | Must be usable | Must be usable | Blurry/night/extreme crop → request replacement |
| Usable angles | Enough context for the space | Enough for plan + views | |
| Missing dimensions | Note gaps | Often blocking for 2D/3D accuracy | Request before clock start |
| Branding files | Logo if branding requested | Logo if branding requested | JPEG/PNG/PDF only |
| File permissions | Customer acknowledged right to submit | Same | If disputed → pause |

Upload limits (already enforced): JPEG/PNG/PDF; max 25 files; 25 MB/file; 250 MB/request; private bucket only.

### B.2 Outcomes

| Outcome | Status / action | Customer communication |
|---|---|---|
| **Files accepted** | `files_accepted`; set `files_accepted_at` and `delivery_clock_started_at`; send `files_accepted` email | Clock started |
| **More information required** | `needs_information`; send `files_need_info` | Order active; clock **not** started |
| **Convert to a call** | Keep status under review / needs info; schedule call | Prefer talk-through for ambiguous briefs / second property |
| **Custom scope required** | `manual_quote_required` path; Build-Ready quote or new package | Do not produce under wrong SKU |
| **Cannot reasonably fulfill** | Pause; if before production and unusable after good-faith requests → cancel + refund per unusable-file policy | Be explicit; no fake delivery |

Unusable-file policy (spec): pause → request replacements → clock does not start until acceptance → if still impossible before production, may cancel and refund rather than deliver unusable work.

---

## C. Delivery-clock start

### Hard rules

1. Payment alone does **not** start the clock.
2. Clock starts only when files **and** instructions are accepted as complete and usable.
3. Applicable status: move to `files_accepted` (then typically `assigned` / `in_progress`).
4. Timestamps: set `files_accepted_at` and `delivery_clock_started_at`.
5. Customer email: `files_accepted` (`sendFilesAcceptedEmail`) — must state the clock has started.
6. **Rush timing** begins only after **rush acceptance** (`rush_approved`) **and** file acceptance. Approving rush without usable files does not start a rush clock.

Internal alert optional after clock start — **OWNER DECISION REQUIRED** whether every clock-start sends `internal_alert`.

---

## D. Assignment

### D.1 Assign internal employee or freelancer

1. In Admin, set `assigned_to` (or equivalent) and move status to `assigned` → `in_progress`.
2. Confirm expected delivery date from clock start + package target (and rush target if approved).
3. Name a **quality reviewer** (can be Frank initially) who must approve first batch / final delivery before customer send.

### D.2 What to copy into Trello / Asana

Safe to copy:

- Request reference
- Package / family
- Project type and high-level brief (sanitized)
- Delivery target / due date
- First-batch size (AI packs)
- Branding yes/no
- “Rush approved: yes/no” and rush target string if approved
- Link to Admin detail (not raw storage paths)

### D.3 What not to share unnecessarily

- Full phone / email unless the assignee needs client contact (prefer Frank/PM as single customer contact)
- Billing amounts, Stripe IDs, payment method details
- Draft recovery tokens
- Signed URL strings that can be forwarded indefinitely (share Admin access or short-lived download process instead)
- Other customers’ data

### D.4 File-access rules

- Staff use **short-lived signed URLs** only.
- No permanent public URLs; no `getPublicUrl`.
- Do not paste signed URLs into public Slack/Trello comments that survive longer than the URL TTL (`HUMAN_POLISH_SIGNED_URL_EXPIRES_IN` = 60 seconds in config — treat as ephemeral; re-fetch from Admin).

### D.5 Confidentiality

Treat all property photos, surveys, HOA docs, and client briefs as confidential customer data. Freelancers must not reuse assets for portfolios without explicit rights permission (see §J).

### D.6 Expected delivery date

Calculate from **clock start**, not checkout time. Document the date in Admin notes / PM tool.

### D.7 Quality-review responsibility

Assignee produces; named reviewer (Frank/PM) checks brief-match and packaging before customer-facing emails (`first_batch_ready`, `final_delivery_ready`).

---

## E. First-batch workflow (AI Render Packs)

| Package | First batch |
|---|---:|
| 25 concepts | 5 |
| 50 concepts | 10 |
| 100 concepts | 15 |

### E.1 Internal review before customer delivery

Reviewer confirms:

- Concepts follow approved written brief (must-haves present; avoids respected)
- Usable resolution (V1 minimum 1080p-quality; landscape target ≥ 1920×1080 when applicable)
- No prohibited claims implied in overlays/text added to images
- Correct request reference / naming

Then set `first_batch_ready` → deliver → `first_batch_delivered` + `first_batch_delivered_at`; send `first_batch_ready` email.

### E.2 First-Batch Brief-Match Guarantee

If the first batch **materially fails to follow the written brief the customer approved**, and the customer notifies within **24 hours**, correct the direction **once** at no additional charge before producing the remainder.

### E.3 What qualifies as correcting the approved brief

- Missing a listed must-have from the approved brief
- Including a listed avoid
- Wrong property / wrong area of the property relative to the brief
- Clear disregard of stated priorities in the approved intake

### E.4 What qualifies as a new direction (not covered)

- New property
- New design direction / style shift after approval
- New client requirements introduced after approval
- Change of mind
- New must-haves not in the approved brief
- Extra variations beyond the purchased pack

These require a new pack, custom fee, or owner-approved exception — **OWNER DECISION REQUIRED** for goodwill exceptions.

### E.5 No customer response within 24 hours

Proceed with the remainder of the pack under the approved brief. Document “no brief-match notice received within window” in Admin notes.

### E.6 When the remainder proceeds

After:

- Customer confirms brief-match; **or**
- 24-hour window elapses with no valid brief-match claim; **or**
- One covered correction is completed

Then continue production to final concept count → final delivery workflow.

---

## F. Final delivery (AI Render Packs and packaged Build-Ready outputs)

### Deliverables (AI Render Pack)

- High-resolution PNGs (one concept each)
- Organized PDF of concepts
- Contractor/company branding on PDF when requested and files provided
- Commercial usage for presentations, proposals, mailers, ads, social, websites, sales collateral
- **No** editable source files unless separately agreed (**OWNER DECISION REQUIRED** for any source-file exception)

### File naming (recommended operational standard)

```text
HP-{requestId}-{package}-{###}-concept.png
HP-{requestId}-{package}-concepts.pdf
```

**OWNER DECISION REQUIRED:** Finalize naming if Admin delivery tooling imposes a different scheme.

### Delivery-link preparation

- Host deliverables in a controlled location (Admin-recorded download URL / private share).
- Pass `downloadUrl` into `final_delivery_ready` email when available.
- Prefer expiring links; never put private bucket paths in email.

### Internal quality review

Before send: count matches package; PDF opens; branding correct; concepts not duplicates of unusable fails; disclaimer not contradicted by file names (“permit”, “stamped”, etc.).

### Customer delivery email and timestamps

1. Send `final_delivery_ready`.
2. Set `final_delivered_at`; status `delivered` (then completion path).
3. Record completion timing vs clock start for ops learning.

---

## G. Build-Ready workflow

### G.1 Essentials 2D — $599

**Includes (spec):** site map; hardscape plan; conceptual material list/legend; survey integration; selected rendering(s) in presentation package; **two** combined revision rounds; target **3–5 business days** after complete-file acceptance **and** payment.

**Ops sequence:**

1. Intake submitted → human scope review (`under_review`).
2. Confirm survey + clear site photos + inspiration/approved concept.
3. If in standard package → approve scope (`build_ready_scope_approved` email) → `ready_for_payment` / payment request.
4. If out of scope → custom quote path (§G.3).
5. After payment + file acceptance → produce → revision rounds as used → deliver.

**Custom-scope triggers (non-exhaustive):** commercial/large acreage; multi-phase; complex grading/civil; multiple properties; permit/architectural/engineering-like requests; deliverables beyond Essentials list.

### G.2 Essentials 3D — $899

Everything in Essentials 2D, plus:

- Three guaranteed human-produced photorealistic views
- Up to two additional supporting/detail views **when scope permits** (discretionary — not guaranteed)
- Geometry / material / lighting / planting refinement
- **Three** combined revision rounds across 2D+3D
- Target **5–10 business days** after file acceptance and payment

Same review → approve or quote → payment → production flow.

### G.3 Custom

1. Manual scope review.
2. Prepare quote (`build_ready_quote` email with amount/message/quote URL when available).
3. Customer approval.
4. Payment request (`build_ready_payment_requested` + Checkout URL).
5. On payment + accepted files → production handoff with written scope attached to the task card.

Do not start Custom production on goodwill before payment unless **OWNER DECISION REQUIRED** exception is documented.

---

## H. Rush workflow

1. Rush request is **not** automatically approved.
2. Capacity review: can the team hit the rush target **after** files are accepted?
3. Fees/targets:
   - 25 → $79 / guaranteed 24-hour delivery (after approval + acceptance)
   - 50 → $79 / guaranteed 48-hour delivery
   - 100 → custom rush terms only
4. If approved: set `rush_approved`; charge rush line per product rules; send `rush_approved` with `rushTarget` (+ `rushFee` when provided).
5. If unavailable: send `rush_unavailable` with `standardDeliveryTarget`; offer standard path.
6. **Missed rush deadline (Renderspace control):** refund **rush fee only**; base package is not refunded solely for missing rush if work remains deliverable.

---

## I. Revisions

| Type | Policy |
|---|---|
| Correction under Brief-Match Guarantee | One no-charge direction correction if claimed within 24h on first batch; AI packs only |
| Included Build-Ready revision | Counts against package rounds (2 for Essentials 2D; 3 for Essentials 3D); refine approved direction |
| New design direction | Not a revision — new package / custom fee |
| Scope expansion | Quote additional fee; do not absorb silently |
| Document every request | Status `revision_requested`; increment `revision_count`; send `revision_request_received`; store customer wording in notes |

Revision may include reasonable changes to materials, planting, layout details, labels, presentation formatting, minor geometry, rendering details.

When to quote an additional fee: new direction, substantial scope change, replacement concept, extra views beyond discretionary 3D allowance, second property, or exhausted revision rounds.

---

## J. Completion and rights request

1. Mark project `completed` after final delivery acceptance / quiet close.
2. Send `final_completion` email (package reference).
3. Send `rights_permission_request` **separately** — permission must be **explicit** (`rights_permission_granted` only after yes).
4. Until permission is granted, do **not** use the work in public case studies, ads, or social proof.
5. Optional CTAs (completion / follow-up): repeat Human Polish order; Renderspace subscription bridge — keep soft; not aggressive post-purchase hard-sell.
6. **90-day pack expiration:** AI Render Packs must be used within 90 days of purchase. Send `pack_expiration_reminder` per scheduled job when implemented. **OWNER DECISION REQUIRED:** exact reminder schedule (e.g. 30/14/7 days) if not coded yet.

---

## K. Daily operator checklist (Frank → PM)

Morning:

- [ ] Triage internal alerts and Admin queues
- [ ] Rush reviews due today
- [ ] `needs_information` aging > 24–48h — nudge customer
- [ ] First-batch 24h windows expiring — proceed remainder if silent
- [ ] Deliveries due today — QA then send

End of day:

- [ ] Confirm paid unpaid mismatches
- [ ] Confirm no signed URLs left in public tools
- [ ] Note any **OWNER DECISION REQUIRED** items for Frank

---

## L. Pricing quick reference (server-authoritative)

| Offer | Amount |
|---|---:|
| 25 standard | $399 |
| 25 first-purchase | $349 |
| 25 subscriber (15%) | $339.15 |
| 50 standard | $699 |
| 50 subscriber | $594.15 |
| 100 standard | $1,199 |
| 100 subscriber | $1,019.15 |
| Rush (25/50) | $79 |
| Essentials 2D | $599 |
| Essentials 3D | $899 |
| Custom | Quoted |

Discounts never stack; tax via Stripe Tax on top.

---

## M. Status vocabulary (do not invent)

`draft` · `submitted` · `needs_information` · `under_review` · `rush_review` · `ready_for_payment` · `awaiting_payment` · `paid` · `files_accepted` · `assigned` · `in_progress` · `first_batch_ready` · `first_batch_delivered` · `ready_for_review` · `delivered` · `revision_requested` · `completed` · `cancelled` · `expired`

Exact transition matrix is enforced by Admin implementation — treat invalid jumps (e.g. unpaid → `in_progress`) as defects.

---

## N. Support contact

Primary ops / customer email: **frank@renderspace.ai**  
Do not invent phone or WhatsApp numbers in SOP replies.
