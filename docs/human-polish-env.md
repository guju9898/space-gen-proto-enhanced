# Human Polish — Environment Variables

Server-only configuration for Human Polish V1. Never expose these to the browser
and never log their values.

## Supabase (existing)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (also used server-side). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for server API routes (draft/upload). Server-only. |

## Rate limiting (Upstash) — added by platform hardening

Used by `lib/human-polish/rate-limit.ts` to enforce distributed rate limits on
the Human Polish guest endpoints (draft create/recover, upload sign/complete,
and later checkout initiation).

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token. Server-only. |

Behavior:

- **Production:** when both variables are set, an Upstash sliding-window limiter
  is used across all serverless instances. If Upstash is configured but a request
  errors, the limiter **fails closed** (denies with a short retry) so an outage
  cannot silently disable rate limiting.
- **Local development:** when the variables are absent, a controlled in-memory
  fallback is used. It is **not distributed** (per-process only) and must not be
  relied upon in production.

## Phone normalization — added by platform hardening

`lib/human-polish/phone.ts` uses `libphonenumber-js` for E.164 normalization.
No environment variables are required. The default country is `US` and is applied
only when the input has no explicit country code.

## Manual setup checklist

1. Create an Upstash Redis database.
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the deployment
   environment (and to `.env.local` for local testing of distributed limits).
3. Confirm these are **not** prefixed with `NEXT_PUBLIC_` (they must stay server-only).
