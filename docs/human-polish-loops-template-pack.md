# Human Polish™ — Loops Transactional Template Pack (V1)

**Purpose:** Provision Loops transactional templates that match the **implemented** email helpers.  
**Code truth:** `lib/human-polish/email.ts`, `lib/human-polish/email-templates.ts`  
**Env map:** `docs/human-polish-env.md`  
**Product rules:** `docs/human-polish-v1-spec.md` §6.2  

> Do not invent `dataVariables` keys. If a useful field is missing from the helper, note it as a code gap — do not put it in the Loops template as if it were sent.

Related earlier copy audit (partial, five events): `docs/human-polish-loops-email-copy.md` (may live only on other branches). This pack is the **full** V1 milestone set.

---

## Naming map (prompt aliases → code keys)

| Prompt / ops name | Canonical email key | Loops event name | Env var |
|---|---|---|---|
| intake_received | `draft_received` | `hp_draft_received` | `LOOPS_HP_DRAFT_RECEIVED_TEMPLATE_ID` |
| payment_received | `payment_received` | `hp_payment_received` | `LOOPS_HP_PAYMENT_RECEIVED_TEMPLATE_ID` |
| files_need_replacement | `files_need_info` | `hp_files_need_info` | `LOOPS_HP_FILES_NEED_INFO_TEMPLATE_ID` |
| files_accepted | `files_accepted` | `hp_files_accepted` | `LOOPS_HP_FILES_ACCEPTED_TEMPLATE_ID` |
| rush_approved | `rush_approved` | `hp_rush_approved` | `LOOPS_HP_RUSH_APPROVED_TEMPLATE_ID` |
| rush_unavailable | `rush_unavailable` | `hp_rush_unavailable` | `LOOPS_HP_RUSH_UNAVAILABLE_TEMPLATE_ID` |
| first_batch_ready | `first_batch_ready` | `hp_first_batch_ready` | `LOOPS_HP_FIRST_BATCH_READY_TEMPLATE_ID` |
| final_delivery_ready | `final_delivery_ready` | `hp_final_delivery_ready` | `LOOPS_HP_FINAL_DELIVERY_READY_TEMPLATE_ID` |
| build_ready_scope_approved | `build_ready_scope_approved` | `hp_build_ready_scope_approved` | `LOOPS_HP_BUILD_READY_SCOPE_APPROVED_TEMPLATE_ID` |
| build_ready_custom_quote | `build_ready_quote` | `hp_build_ready_quote` | `LOOPS_HP_BUILD_READY_QUOTE_TEMPLATE_ID` |
| build_ready_payment_requested | `build_ready_payment_requested` | `hp_build_ready_payment_requested` | `LOOPS_HP_BUILD_READY_PAYMENT_REQUESTED_TEMPLATE_ID` |
| revision_received | `revision_request_received` | `hp_revision_request_received` | `LOOPS_HP_REVISION_REQUEST_RECEIVED_TEMPLATE_ID` |
| completed | `final_completion` | `hp_final_completion` | `LOOPS_HP_FINAL_COMPLETION_TEMPLATE_ID` |
| rights_request | `rights_permission_request` | `hp_rights_permission_request` | `LOOPS_HP_RIGHTS_PERMISSION_REQUEST_TEMPLATE_ID` |
| expiration_reminder | `pack_expiration_reminder` | `hp_pack_expiration_reminder` | `LOOPS_HP_PACK_EXPIRATION_REMINDER_TEMPLATE_ID` |
| internal_alert | `internal_alert` | `hp_internal_alert` | `LOOPS_HP_INTERNAL_ALERT_TEMPLATE_ID` |

Shared transport: `LOOPS_API_KEY` required or all sends no-op. Empty optional vars are stripped (`compactVariables`). Recipient address is Loops `email`, not a data variable.

Suggested Loops insert form: `{variableName}` — **confirm in Loops editor**.

Support contact used in copy: **frank@renderspace.ai** (static, approved). Do not invent WhatsApp numbers.

---

## Duplicate-send protection (global)

| Pattern | Recommendation |
|---|---|
| Payment email | Send only after idempotent paid transition; count-guard / “already sent” flag on request (webhook already intended to be count-guarded) |
| Draft received | Once per successful submit for that request; do not resend on recover |
| Files accepted / rush / first batch / final delivery | Once per milestone timestamp; Admin action should be idempotent |
| Expiration reminder | At most one send per reminder tier per request (e.g. per days-remaining bucket) |
| Internal alert | Dedupe by `(requestId, subject)` within a short window when possible |
| Provider failure | DB/status update must succeed even if Loops fails; retry manually from Admin if built — do not double-apply payment |

---

## Template 1 — `draft_received` (intake_received)

1. **Internal event name:** `draft_received` / `hp_draft_received`  
2. **Recommended Loops template name:** `HP — Draft Received`  
3. **Subject:** We received your Human Polish request ({package})  
4. **Preview text:** Your information is saved. Production has not started yet.  
5. **Body:**

Hi {contactName},

We received your Human Polish™ request and saved your intake.

Request reference: {requestId}  
Service: {serviceFamily}  
Package: {package}

Production has **not** started.  
The delivery clock has **not** started. Timing begins only after payment is complete **and** Renderspace confirms your files and instructions are complete and usable.

Next steps:  
- AI Render Packs — complete secure checkout for this package (one pack, one project, one property).  
- Build-Ready Packages — wait for human scope review before payment and production.

If a continue link is available: {recoveryUrl}  
Draft recovery remains available for about {recoveryWindowMinutes} minutes of inactivity while your request is still in early intake. Keep reference {requestId}.

Questions: frank@renderspace.ai

6. **CTA label:** Continue your request (only if `recoveryUrl` present)  
7. **CTA destination type:** Optional intake deep-link (`recoveryUrl`) — **not** a claim of one-click token recovery unless product later embeds a safe signed link  
8. **Required variables:** `requestId`, `serviceFamily`, `package`, `recoveryWindowMinutes`  
9. **Optional:** `contactName`, `recoveryUrl`  
10. **Trigger:** `POST /api/human-polish/draft/submit` → `sendDraftReceivedEmail`  
11. **Duplicate protection:** Once per successful submit per request  

---

## Template 2 — `payment_received`

1. **Internal event name:** `payment_received` / `hp_payment_received`  
2. **Template name:** `HP — Payment Received`  
3. **Subject:** Payment confirmed — Human Polish {package}  
4. **Preview:** Payment received. File review is next. The delivery clock has not started.  
5. **Body:**

Hi {contactName},

Payment confirmed for your Human Polish™ order.

Request reference: {requestId}  
Service: {serviceFamily}  
Package: {package}  
Amount paid: {amount}

What happens next:  
1. Our team reviews your files and instructions.  
2. If anything is missing, we will email you.  
3. When files are accepted, you will receive a separate email — **that** is when the delivery clock starts.

Production has **not** started.  
The delivery clock has **not** started.  
Standard timing targets (when shown) such as {deliveryTarget} apply only after file acceptance.

When provided for AI Render Packs: initial batch size {firstBatchSize} concepts after files are accepted. The First-Batch Brief-Match Guarantee is a bounded review window — not open-ended revisions.

This email does **not** confirm rush timing. Rush requires separate manual approval.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA label:** None supported by current contract  
7. **CTA destination type:** N/A  
8. **Required:** `requestId`, `serviceFamily`, `package`  
9. **Optional:** `contactName`, `amount`, `deliveryTarget`, `firstBatchSize`  
10. **Trigger:** HP webhook after paid transition → `sendPaymentReceivedEmail`  
11. **Duplicate protection:** Count-guard on paid transition; never send on duplicate webhook  

---

## Template 3 — `files_need_info` (files_need_replacement)

1. **Internal event name:** `files_need_info` / `hp_files_need_info`  
2. **Template name:** `HP — Files Need Information`  
3. **Subject:** Action needed: update files for Human Polish request {requestId}  
4. **Preview:** Your order is active. Production is paused. The delivery clock has not started.  
5. **Body:**

Hi {contactName},

We reviewed materials for Human Polish request {requestId}. Something is missing, unclear, or not usable yet.

Your order remains active.  
Production is paused.  
The delivery clock has **not** started.

What we need:  
{message}

Items called out: {requestedItems}

Reply to this email with updates and include request {requestId}.

Help: frank@renderspace.ai

6. **CTA:** None in current contract (no upload URL variable)  
7. **CTA type:** N/A — reply-to-email workflow  
8. **Required:** `requestId`  
9. **Optional:** `contactName`, `message`, `requestedItems` (comma-joined string)  
10. **Trigger:** Admin “request more/replacement files” → `sendFilesNeedInfoEmail`  
11. **Duplicate protection:** Allow resend when a **new** request-for-info is issued; avoid auto-resend loops  

---

## Template 4 — `files_accepted`

1. **Internal event name:** `files_accepted` / `hp_files_accepted`  
2. **Template name:** `HP — Files Accepted`  
3. **Subject:** Files accepted — delivery clock started ({package})  
4. **Preview:** Files and instructions look good. The delivery clock has started.  
5. **Body:**

Hi {contactName},

Your files and instructions for request {requestId} are complete and usable.

Service: {serviceFamily}  
Package: {package}  
Delivery target: {deliveryTarget}

**The delivery clock has now started.** Timing is measured from this acceptance (after payment), not from intake alone.

AI Render Packs: when provided, we begin with {firstBatchSize} concepts for brief-match review. The guarantee is bounded — not open-ended revisions.

Build-Ready: production follows approved scope; revision rounds are limited. Packages support visualization, client presentation, and HOA/design-review workflows. They do **not** include architectural, structural, civil, or engineering services; seals; permit drawings; or construction documents.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA:** None  
7. **CTA type:** N/A  
8. **Required:** `requestId`, `serviceFamily`, `package`  
9. **Optional:** `contactName`, `deliveryTarget`, `firstBatchSize`  
10. **Trigger:** Admin accept files / start clock → `sendFilesAcceptedEmail`  
11. **Duplicate protection:** Once per `files_accepted_at` / clock-start event  

---

## Template 5 — `rush_approved`

1. **Internal event name:** `rush_approved` / `hp_rush_approved`  
2. **Template name:** `HP — Rush Approved`  
3. **Subject:** Rush approved for request {requestId}  
4. **Preview:** Your rush request was approved. Timing starts after file acceptance.  
5. **Body:**

Hi {contactName},

Good news — we approved rush handling for Human Polish request {requestId}.

Approved rush target: {rushTarget}  
Rush fee: {rushFee}

Important: rush timing applies only after your files and instructions are accepted as complete and usable. Payment of the rush fee alone does not start the clock if files are still incomplete.

If we miss an approved rush deadline for reasons within Renderspace’s control, the rush fee is refundable under our rush-fee policy. The base package is not refunded solely because the rush deadline was missed when the work remains deliverable.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA:** None  
7. **CTA type:** N/A  
8. **Required:** `requestId`, `rushTarget`  
9. **Optional:** `contactName`, `rushFee`  
10. **Trigger:** Admin approve rush → `sendRushApprovedEmail`  
11. **Duplicate protection:** Once per approval decision  

---

## Template 6 — `rush_unavailable`

1. **Internal event name:** `rush_unavailable` / `hp_rush_unavailable`  
2. **Template name:** `HP — Rush Unavailable`  
3. **Subject:** Rush not available — standard delivery for {requestId}  
4. **Preview:** We cannot confirm rush capacity. Standard delivery remains available.  
5. **Body:**

Hi {contactName},

We reviewed rush capacity for Human Polish request {requestId}.

We cannot confirm a rush guarantee at this time. You may continue with standard delivery.

Standard delivery target: {standardDeliveryTarget}

Reply if you want to proceed on standard timing, adjust scope, or discuss alternatives.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA:** None  
7. **CTA type:** N/A  
8. **Required:** `requestId`, `standardDeliveryTarget`  
9. **Optional:** `contactName`  
10. **Trigger:** Admin reject / unavailable rush → `sendRushUnavailableEmail`  
11. **Duplicate protection:** Once per rejection decision  

---

## Template 7 — `first_batch_ready`

1. **Internal event name:** `first_batch_ready` / `hp_first_batch_ready`  
2. **Template name:** `HP — First Batch Ready`  
3. **Subject:** First {firstBatchSize} concepts ready — review within {reviewWindowHours} hours  
4. **Preview:** Your first batch is ready. Brief-match review window is time-limited.  
5. **Body:**

Hi {contactName},

Your first batch for Human Polish request {requestId} is ready.

Concepts in this batch: {firstBatchSize}  
Review window: {reviewWindowHours} hours

Please review against your **approved written brief**. If this batch materially fails to follow that brief, notify us within the review window and we will correct the direction once at no additional charge before producing the remaining concepts.

This guarantee does **not** cover a new property, new design direction, new client requirements after approval, a change of mind, new must-haves not in the brief, or extra variations beyond your pack.

If we do not hear from you within the window, we will proceed with the remainder of the pack under the approved brief.

Review link (when provided): {reviewUrl}

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA label:** Review first batch (only if `reviewUrl` present)  
7. **CTA destination type:** Optional review URL  
8. **Required:** `requestId`, `firstBatchSize`  
9. **Optional:** `contactName`, `reviewWindowHours` (defaults to 24 in code), `reviewUrl`  
10. **Trigger:** Admin first-batch delivery → `sendFirstBatchReadyEmail`  
11. **Duplicate protection:** Once per first-batch delivery timestamp  

---

## Template 8 — `final_delivery_ready`

1. **Internal event name:** `final_delivery_ready` / `hp_final_delivery_ready`  
2. **Template name:** `HP — Final Delivery Ready`  
3. **Subject:** Your Human Polish delivery is ready — {package}  
4. **Preview:** PNG and organized PDF deliverables are ready for download.  
5. **Body:**

Hi {contactName},

Your Human Polish™ delivery for request {requestId} is ready.

Package: {package}  
Concept count (when applicable): {conceptCount}

Download (when provided): {downloadUrl}

You receive high-resolution PNG concepts and an organized PDF. These are conceptual / presentation assets for client selling and HOA/design-review support. They are **not** architectural, structural, civil, engineering, stamped, permit, or construction documents.

Editable source files are not included unless separately agreed.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA label:** Download deliverables (if `downloadUrl` present)  
7. **CTA destination type:** Download / delivery URL  
8. **Required:** `requestId`, `package`  
9. **Optional:** `contactName`, `conceptCount`, `downloadUrl`  
10. **Trigger:** Admin final delivery → `sendFinalDeliveryReadyEmail`  
11. **Duplicate protection:** Once per `final_delivered_at`  

---

## Template 9 — `build_ready_scope_approved`

1. **Internal event name:** `build_ready_scope_approved` / `hp_build_ready_scope_approved`  
2. **Template name:** `HP — Build-Ready Scope Approved`  
3. **Subject:** Scope approved — {package} (request {requestId})  
4. **Preview:** Your Build-Ready scope was approved. Payment is next when requested.  
5. **Body:**

Hi {contactName},

We approved the scope for your Build-Ready request {requestId}.

Package: {package}  
Delivery target after payment and file acceptance: {deliveryTarget}  
Included revision rounds: {revisionRounds}

Next you will receive a payment request (or checkout link) for the approved package. Production timing starts only after payment **and** file acceptance.

Build-Ready packages support visualization, client presentation, and HOA/design-review workflows. They do **not** include seals, permit drawings, or construction documents. We do not guarantee HOA approval.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA:** None in current contract  
7. **CTA type:** N/A  
8. **Required:** `requestId`, `package`  
9. **Optional:** `contactName`, `deliveryTarget`, `revisionRounds`  
10. **Trigger:** Admin scope approval → `sendBuildReadyScopeApprovedEmail`  
11. **Duplicate protection:** Once per scope-approval decision  

---

## Template 10 — `build_ready_quote` (build_ready_custom_quote)

1. **Internal event name:** `build_ready_quote` / `hp_build_ready_quote`  
2. **Template name:** `HP — Build-Ready Custom Quote`  
3. **Subject:** Custom quote / information for request {requestId}  
4. **Preview:** Your Build-Ready request needs a custom quote or more information.  
5. **Body:**

Hi {contactName},

We reviewed Build-Ready request {requestId}.

Quoted amount (when provided): {quotedAmount}

Details:  
{message}

Review / respond (when provided): {quoteUrl}

No production starts until scope is agreed and payment is collected for the approved quote.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA label:** Review quote (if `quoteUrl` present)  
7. **CTA destination type:** Quote review URL  
8. **Required:** `requestId`  
9. **Optional:** `contactName`, `quotedAmount`, `message`, `quoteUrl`  
10. **Trigger:** Admin custom quote / more-info → `sendBuildReadyQuoteEmail`  
11. **Duplicate protection:** Allow new send when quote is revised; avoid identical resends within minutes  

---

## Template 11 — `build_ready_payment_requested`

1. **Internal event name:** `build_ready_payment_requested` / `hp_build_ready_payment_requested`  
2. **Template name:** `HP — Build-Ready Payment Requested`  
3. **Subject:** Payment requested — {package} ({requestId})  
4. **Preview:** Your Build-Ready scope is ready for payment.  
5. **Body:**

Hi {contactName},

Payment is requested for Human Polish Build-Ready request {requestId}.

Package: {package}  
Amount: {amount}

Pay securely (when provided): {checkoutUrl}

After payment, our team confirms files are still complete and usable, then production timing begins.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA label:** Pay now (if `checkoutUrl` present)  
7. **CTA destination type:** Stripe Checkout URL  
8. **Required:** `requestId`, `package`  
9. **Optional:** `contactName`, `amount`, `checkoutUrl`  
10. **Trigger:** Admin send payment request → `sendBuildReadyPaymentRequestedEmail`  
11. **Duplicate protection:** New Checkout session may warrant a new email; do not spam identical links  

---

## Template 12 — `revision_request_received` (revision_received)

1. **Internal event name:** `revision_request_received` / `hp_revision_request_received`  
2. **Template name:** `HP — Revision Request Received`  
3. **Subject:** We received your revision request ({requestId})  
4. **Preview:** Your revision request is logged. We will confirm if it is in-scope.  
5. **Body:**

Hi {contactName},

We received a revision request for Human Polish request {requestId}.

Revision round (when tracked): {revisionNumber}  
Summary: {message}

We will confirm whether this is an included refinement of the approved direction, a Brief-Match correction (AI Render Packs, when applicable), or a new direction / scope change that may require an additional fee or new package.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA:** None  
7. **CTA type:** N/A  
8. **Required:** `requestId`  
9. **Optional:** `contactName`, `revisionNumber`, `message`  
10. **Trigger:** Revision intake / Admin → `sendRevisionRequestReceivedEmail`  
11. **Duplicate protection:** Once per logged revision event  

---

## Template 13 — `final_completion` (completed)

1. **Internal event name:** `final_completion` / `hp_final_completion`  
2. **Template name:** `HP — Final Completion`  
3. **Subject:** Project complete — {package} ({requestId})  
4. **Preview:** Your Human Polish project is marked complete.  
5. **Body:**

Hi {contactName},

Human Polish request {requestId} ({package}) is marked complete.

Thank you for trusting Renderspace as your outsourced visualization department. When you need another pack or a Build-Ready presentation package, start at renderspace.ai/human-polish.

If you are exploring faster self-serve concepting between Human Polish jobs, Renderspace Professional / Business subscriptions remain available inside the product.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA label:** None in current contract (soft text link OK as static URL)  
7. **CTA destination type:** Optional static marketing URL (not a data variable)  
8. **Required:** `requestId`, `package`  
9. **Optional:** `contactName`  
10. **Trigger:** Admin mark completed → `sendFinalCompletionEmail`  
11. **Duplicate protection:** Once per completion  

---

## Template 14 — `rights_permission_request` (rights_request)

1. **Internal event name:** `rights_permission_request` / `hp_rights_permission_request`  
2. **Template name:** `HP — Rights Permission Request`  
3. **Subject:** May we feature your Human Polish project? ({requestId})  
4. **Preview:** Optional permission request — your “yes” must be explicit.  
5. **Body:**

Hi {contactName},

For Human Polish request {requestId}, may we feature anonymized or attributed project visuals in Renderspace case studies, marketing, or educational materials?

This is optional and separate from your purchase. We will not use the work publicly for marketing without your explicit permission.

Respond here (when provided): {permissionUrl}  
Or reply to this email with a clear yes or no.

Questions: frank@renderspace.ai — include {requestId}.

6. **CTA label:** Respond to permission request (if `permissionUrl` present)  
7. **CTA destination type:** Permission URL  
8. **Required:** `requestId`  
9. **Optional:** `contactName`, `permissionUrl`  
10. **Trigger:** Delivery / rights flywheel → `sendRightsPermissionRequestEmail`  
11. **Duplicate protection:** Prefer one request per project unless customer asks to revisit  

---

## Template 15 — `pack_expiration_reminder` (expiration_reminder)

1. **Internal event name:** `pack_expiration_reminder` / `hp_pack_expiration_reminder`  
2. **Template name:** `HP — Pack Expiration Reminder`  
3. **Subject:** Reminder: {package} use window ends {expiresOn}  
4. **Preview:** AI Render Packs must be used within {packWindowDays} days of purchase.  
5. **Body:**

Hi {contactName},

This is a reminder about Human Polish request {requestId}.

Package: {package}  
Pack use window: {packWindowDays} days from purchase  
Expires on: {expiresOn}  
Days remaining: {daysRemaining}

If production has not finished (or has not started) because we are waiting on files or decisions, reply with request {requestId} so we can help you use the pack before expiration.

Questions: frank@renderspace.ai

6. **CTA:** None in current contract  
7. **CTA type:** N/A  
8. **Required:** `requestId`, `package`  
9. **Optional:** `contactName`, `expiresOn`, `daysRemaining`, `packWindowDays` (code also sends window days from config = 90)  
10. **Trigger:** Scheduled job → `sendPackExpirationReminderEmail`  
11. **Duplicate protection:** One send per reminder tier per request  

**OWNER DECISION REQUIRED:** Cadence (e.g. 30/14/7 days) if not implemented in the scheduler yet.

---

## Template 16 — `internal_alert`

1. **Internal event name:** `internal_alert` / `hp_internal_alert`  
2. **Template name:** `HP — Internal Team Alert`  
3. **Subject:** Use data variable `{subject}` as the email subject  
4. **Preview:** `{summary}`  
5. **Body (PM summary layout):**

**Human Polish — internal alert**

### {subject}

| Field | Value |
|---|---|
| Request reference | {requestId} |
| Summary | {summary} |
| Admin | {adminUrl} |

**Operator checklist (read from Admin — not separate email vars):**  
Confirm in the dashboard: customer/company, family/package, rush status, payment state, deadline, project type.  
Do **not** expect those fields as individual Loops variables today.

**Required action:** Take the next queue step (scope review, file review, rush decision, assignment, or customer follow-up).

**Open request:** button when `{adminUrl}` present.

**Notes:**  
- Do not promise rush until approved.  
- Delivery clock starts only after payment **and** file acceptance.  
- Build-Ready is review-first before payment.  
- Never put recovery tokens, service-role credentials, signed URLs, or unnecessary payment secrets in `summary`.

6. **CTA label:** Open admin view  
7. **CTA destination type:** Admin dashboard URL (`adminUrl`)  
8. **Required:** `subject`  
9. **Optional:** `requestId`, `summary`, `adminUrl`  
10. **Trigger:** Draft submit, paid webhook, and later Admin milestones → `sendInternalTeamAlertEmail` (default `frank@renderspace.ai`)  
11. **Duplicate protection:** Soft-dedupe by request + subject window  

### Recommended `summary` string for callers (until richer vars exist)

Callers should pack a single-line PM summary, for example:

```text
company=Acme Landscaping | family=AI Render Packs | package=50 concepts | rush=requested | payment=paid | deadline=2026-09-01 | projectType=landscape_outdoor_living
```

**Code gap (not inventable in Loops alone):** dedicated keys for customer, company, rush, payment, deadline, project type. Marked **OWNER DECISION REQUIRED** whether to extend `InternalTeamAlertEmailParams` later.

---

## Provisioning checklist

1. Create 16 transactional templates in Loops with the names above.  
2. Add only the listed `dataVariables`.  
3. Set each `LOOPS_HP_*_TEMPLATE_ID` in Preview first.  
4. Set `LOOPS_API_KEY` and `LOOPS_HP_INTERNAL_ALERT_EMAIL=frank@renderspace.ai`.  
5. Test wired sends (`draft_received`, `payment_received`, `internal_alert`) in Preview.  
6. Hold Admin-triggered templates until Admin QA passes.  
7. Promote template IDs to Production only after Preview sign-off.  
8. Never commit API keys or real template IDs to git.

---

## Compliance guardrails (all templates)

- No HOA approval guarantees  
- No architectural / engineering / permit / sealed-plan implications  
- No “production started” before file acceptance  
- No rush timing before approval  
- No open-ended AI Render Pack revisions  
- Clear separation: conceptual AI packs vs Build-Ready presentation packages  
- No invented WhatsApp numbers  
- No secrets in variables or footers  
