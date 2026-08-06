# Human Polish™ — Admin Dashboard QA Plan (V1)

**When to run:** Immediately after the Admin dashboard branch is merged into the deployment branch (`enhanced-studio-ui` / production candidate).  
**Admin route (spec):** `/admin/human-polish`  
**Do not:** Run destructive tests against production customer records. Use Preview / test Stripe / synthetic requests only.

**Canonical statuses:** `lib/human-polish/types.ts`  
**Email helpers:** `lib/human-polish/email.ts`  
**Env:** `docs/human-polish-env.md`

### How to use this sheet

| Field | Meaning |
|---|---|
| Test ID | Stable ID |
| Setup | Prerequisites |
| Action | Exact steps |
| Expected | Pass criteria |
| Pass/Fail | Tester fills |
| Evidence | Screenshot, log snippet, request id (synthetic only) |

---

## Prerequisites (before QA)

| ID | Item | Required before |
|---|---|---|
| PRE-01 | Admin branch merged; Preview deploy healthy | All Admin tests |
| PRE-02 | Test admin user on allowlist; non-admin test user available | AUTH-* |
| PRE-03 | Stripe **test** mode; HP webhook pointing at Preview | OPS email / payment-adjacent |
| PRE-04 | Supabase test project or isolated data; private bucket intact | FILES-* |
| PRE-05 | Loops Preview template IDs set **or** accept skip/`template_not_provisioned` | EMAIL-* |
| PRE-06 | At least 3 synthetic requests (AI pack paid, Build-Ready submitted, empty-search fixtures) | LIST / DETAIL |
| PRE-07 | Written rollback owner for Preview-only data cleanup | All |

---

## AUTHORIZATION

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| AUTH-01 | Logged out | Visit `/admin/human-polish` | Redirect/deny; no request data leaked | | |
| AUTH-02 | Authenticated non-admin | Visit list + detail URLs | Forbidden / not found; no PII | | |
| AUTH-03 | Authenticated admin on allowlist | Visit list | 200; request list loads | | |
| AUTH-04 | Non-admin session | Invoke Admin server action / mutation directly (documented action name) | Rejected; no status change | | |
| AUTH-05 | Remove/blank admin env allowlist in Preview **only** | Restart Preview; admin user retries | Controlled deny; no open admin | | |

**OWNER DECISION REQUIRED:** Exact admin allowlist env var name once Admin ships (not invent here if absent from `docs/human-polish-env.md`).

---

## REQUEST LIST

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| LIST-01 | Zero matching fixtures (filter to impossible query) | Open list | Empty state copy; no error | | |
| LIST-02 | > page size of synthetic rows | Paginate next/prev | Stable pages; no dup/missing ids | | |
| LIST-03 | Known request reference | Search by reference | Exact match | | |
| LIST-04 | Known company/customer | Search by name/company | Expected rows; no cross-tenant bleed | | |
| LIST-05 | Mixed statuses | Apply status / family / rush filters | Filter correctness | | |
| LIST-06 | Sortable columns present | Sort by updated / deadline / status | Order changes correctly | | |
| LIST-07 | Rows with email/phone | Inspect list cells | PII masked in list (e.g. partial email/phone) per Admin design | | |
| LIST-08 | Force API error (invalid filter or broken mock) | Trigger error path | Error state; no blank crash | | |

---

## DETAIL PAGE

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| DET-01 | Valid synthetic request id | Open detail | Contact, package, brief, files, payment, timestamps visible to admin | | |
| DET-02 | Random UUID / invalid id | Open detail | 404 / not found; no stack trace | | |
| DET-03 | Paid AI pack | Inspect customer block | Name, email, phone, company, preferred contact | | |
| DET-04 | Paid request | Inspect payment block | Amount, payment_status, promotion, stripe ids as designed (no card PAN) | | |
| DET-05 | Intake with brief fields | Inspect brief | Objectives, must-haves, avoids, success definition | | |
| DET-06 | Submitted acknowledgments | Inspect ack timestamps | terms / scope / marketing flags as stored | | |
| DET-07 | Clock-started request | Inspect ops timestamps | `files_accepted_at`, `delivery_clock_started_at`, batch/final timestamps when set | | |

---

## PRIVATE FILES

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| FILE-01 | Admin; file on request | Request signed download | Short-lived URL works | | |
| FILE-02 | Capture signed URL | Wait past expiry (config: 60s) | Access denied / expired | | |
| FILE-03 | Inspect storage metadata | Confirm stored path | No permanent public URL; bucket private | | |
| FILE-04 | File belongs to request A | Open from request A detail | Success | | |
| FILE-05 | Attempt signed link for request B file via A context / forged id | Request download | Denied | | |
| FILE-06 | Non-admin | Request signed link API/action | Denied | | |

---

## OPERATIONS

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| OPS-01 | Paid; usable files | Accept files | Status `files_accepted`; clock timestamps set; `files_accepted` email attempted | | |
| OPS-02 | Paid; bad files | Request replacement | Status `needs_information`; `files_need_info` email; clock **not** started | | |
| OPS-03 | Rush requested; capacity OK | Approve rush | `rush_approved` true; `rush_approved` email | | |
| OPS-04 | Rush requested; no capacity | Reject rush | `rush_unavailable` email; standard path available | | |
| OPS-05 | Files accepted | Assign teammate | `assigned_to` set; status `assigned`/`in_progress` | | |
| OPS-06 | Paid only | Attempt start clock without accept | Blocked **or** equivalent to accept-files; no silent clock | | |
| OPS-07 | Assigned | Mark in progress | Status `in_progress` | | |
| OPS-08 | AI pack in progress | Mark first batch ready | `first_batch_ready`; email with batch size | | |
| OPS-09 | First batch ready | Mark first batch delivered | `first_batch_delivered` + timestamp | | |
| OPS-10 | Remainder done | Final delivery | `delivered` / `final_delivered_at`; `final_delivery_ready` email | | |
| OPS-11 | Build-Ready revision | Increment revision | `revision_count` updates; optional `revision_request_received` email | | |
| OPS-12 | Delivered | Mark completed | `completed`; `final_completion` email | | |
| OPS-13 | Completed | Send rights request | `rights_request_sent`; `rights_permission_request` email; grant only on explicit yes | | |

---

## STATUS VALIDATION

Valid statuses:  
`draft` · `submitted` · `needs_information` · `under_review` · `rush_review` · `ready_for_payment` · `awaiting_payment` · `paid` · `files_accepted` · `assigned` · `in_progress` · `first_batch_ready` · `first_batch_delivered` · `ready_for_review` · `delivered` · `revision_requested` · `completed` · `cancelled` · `expired`

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| ST-01 | Documented happy path AI | Walk each valid forward transition | All succeed with audit/timestamps | | |
| ST-02 | Documented happy path Build-Ready | Review → ready_for_payment → awaiting_payment → paid → … | Matches review-first rules | | |
| ST-03 | `submitted` unpaid AI edge | Force `in_progress` | Rejected | | |
| ST-04 | `paid` unpaid mismatch | Force production without `payment_status=paid` | Rejected | | |
| ST-05 | `completed` | Move casually to `in_progress` | Rejected or requires explicit reopen (**OWNER DECISION** if reopen exists) | | |
| ST-06 | Two admins; same detail | Stale page saves older status | Concurrency: last-write protected / conflict error / version check | | |
| ST-07 | Representative invalid jumps | e.g. `draft`→`delivered`, `cancelled`→`paid` | Rejected with clear error | | |

---

## EMAILS

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| EM-01 | Template IDs provisioned | Trigger milestone | `sent: true` path; Loops activity shows correct keys | | |
| EM-02 | Unset template id (TODO_) | Trigger milestone | Skip `template_not_provisioned`; **no** throw; DB update still succeeds | | |
| EM-03 | Invalid Loops key / forced 5xx | Trigger milestone | Failure logged without PII dump; order state preserved | | |
| EM-04 | Accept files while Loops down | Accept files | Status/timestamps saved; email failed/skipped | | |
| EM-05 | Replay same Admin action | Second send attempt | Duplicate protection / no duplicate customer email | | |
| EM-06 | Inspect payload | Compare to `email.ts` | Only documented variables; no tokens/secrets/signed long-lived URLs | | |

---

## REGRESSIONS (public product)

Run on same Preview commit as Admin merge.

| Test ID | Setup | Action | Expected result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| REG-01 | Guest | Complete `/human-polish` → intake | Wizard works | | |
| REG-02 | AI pack draft | Guest Checkout test mode | Session creates; success page verifies | | |
| REG-03 | Paid test session | HP webhook | Paid transition; subscription tables untouched | | |
| REG-04 | Authenticated subscriber | Subscription Checkout smoke | Existing subscription flow OK | | |
| REG-05 | Studio user | Generate/render smoke | Studio intact | | |
| REG-06 | — | `/contractor-demo` | Loads | | |
| REG-07 | — | `/book-demo` (or current book-demo route) | Loads | | |
| REG-08 | Mobile viewport | Intake + Admin list | Usable; no horizontal breakage | | |

---

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| QA runner | | | |
| Admin agent owner | | | |
| Frank / product owner | | | |

**Production customer data:** do not delete, overwrite, or bulk-email production rows during this plan.
