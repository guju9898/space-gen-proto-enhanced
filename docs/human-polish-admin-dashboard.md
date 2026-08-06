# Human Polish — Admin Dashboard

Internal operations UI for Human Polish V1.

## Routes

| Route | Purpose |
|---|---|
| `/admin/human-polish` | Request list with filters and pagination |
| `/admin/human-polish/[requestId]` | Request detail, private files, workflow actions |

## Authorization

| Variable | Purpose |
|---|---|
| `HUMAN_POLISH_ADMIN_EMAILS` | Comma-separated allowlist of admin emails. Server-only. |

Example:

```text
HUMAN_POLISH_ADMIN_EMAILS=frank@renderspace.ai,other-admin@renderspace.ai
```

Rules:

- Emails are trimmed and lowercased before comparison.
- Missing or empty allowlist fails closed (no admin access).
- Do **not** prefix with `NEXT_PUBLIC_`.
- Set in both **Preview** and **Production**.
- Admins must also be authenticated via Supabase Auth (same login as the studio).
- Unauthenticated users are redirected through `/?login=1` with `auth_redirect_next`.
- Authenticated non-admins receive a controlled forbidden page.
- Every server action (including signed-file open) re-checks authorization independently.

Also requires existing server config:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (user session)
- `SUPABASE_SERVICE_ROLE_KEY` (admin reads/writes; never exposed to the browser)

## Private files

- Bucket `human-polish-uploads` remains private.
- Admin UI does **not** call `getPublicUrl`.
- “Open file” creates a **60-second** signed URL only after admin authorization.
- The file row must belong to the request id in the URL (cross-request access blocked).
- Signed URLs are not stored in the database.

## Workflow actions (V1)

Explicit buttons only (no free-form status dropdown):

1. Request additional / replacement files → `needs_information` (+ optional Loops email)
2. Mark files accepted → `files_accepted` + start delivery clock
3. Approve rush / reject rush
4. Assign team member
5. Start production → `in_progress`
6. First batch ready → `first_batch_ready`
7. Record first-batch delivery → `first_batch_delivered`
8. Record final delivery → `delivered`
9. Mark completed → `completed`

Guards:

- Unpaid requests cannot enter production actions.
- Cancelled / expired / completed requests are locked from casual resume or reverse moves.
- Updates use `updated_at` as an optimistic concurrency check.

Loops emails reuse existing helpers in `lib/human-polish/email.ts`. Database updates succeed even when Loops is unconfigured or fails; the UI may show a warning.

## Known V1 limitations

- Build-Ready scope/quote/payment-request admin flows are not fully exposed yet.
- Optional Loops templates may be unprovisioned; sends no-op safely.
- No bulk actions, notes timeline, or Trello/Asana sync.
- Phone numbers appear on the detail page for ops; list page omits them.
- `message` / `requestedItems` for files-need-info depend on Loops template readiness.
