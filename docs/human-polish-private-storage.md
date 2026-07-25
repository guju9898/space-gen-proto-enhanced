# Human Polish — private storage setup

Bucket name: `human-polish-uploads`

## Requirements (spec §7.2)

- `public = false`
- No public read policy
- No anonymous direct listing
- Never call `getPublicUrl` for Human Polish objects
- Uploads via server-issued short-lived signed upload URLs
- Staff downloads via short-lived signed download URLs
- Persist `object_path` (and `bucket_name`) in `human_polish_files`, never a permanent public URL

## Object path

```text
{request_id}/{file_type}/{uuid}-{sanitized_filename}
```

## Limits (enforced server-side)

| Limit | Value |
|---|---|
| MIME | `image/jpeg`, `image/png`, `application/pdf` |
| Max files / request | 25 |
| Max size / file | 25 MB |
| Max total / request | 250 MB |
| Signed URL TTL | 60 seconds |

## Apply

The foundation migration creates the bucket and tables:

```text
supabase/migrations/20260716150000_human_polish_foundation.sql
```

Apply with your normal Supabase migration workflow (CLI `db push` / hosted migration runner).

## Runtime environment

Server routes need:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the browser)

No additional Human Polish–specific env vars are required for draft + signed upload in Phase 1.

## API contract

| Route | Purpose |
|---|---|
| `POST /api/human-polish/draft` | Create draft request; returns `requestId` + one-time `draftToken` |
| `POST /api/human-polish/draft/recover` | Recover draft within 15 minutes using `requestId` + `draftToken` |
| `POST /api/human-polish/upload/sign` | Issue signed upload URL bound to a valid draft |
| `POST /api/human-polish/upload/complete` | Register file metadata after a successful signed upload |

All guest table access goes through these service-role routes. RLS is enabled with no anonymous table write/read policies.
