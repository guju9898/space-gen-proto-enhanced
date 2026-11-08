# Renderspace Public API v1

## Status

Live on `enhanced-studio-ui`. API renders cost **2 credits** each (`API_RENDER_CREDIT_COST`).

## Env vars

| Var | Purpose |
| --- | --- |
| `API_KEY_PEPPER` | Optional pepper for hashing API keys / encrypting webhook secrets. Falls back to `SUPABASE_SERVICE_ROLE_KEY` if unset — set a dedicated pepper in production. |
| `PUBLIC_API_CORS_ORIGINS` | Optional comma-separated Origin allowlist for Bearer `/api/v1` routes. Unset or `*` → wildcard `*`. Never pairs credentials with `*`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` / `UPSTASH_RATELIMIT_PREFIX` | Required in production for `/api/v1/*` rate limits (60 req/min/key). |
| Existing generation vars | `OPENROUTER_API_KEY`, `REPLICATE_API_TOKEN`, Supabase URL + service role |

## CORS

Bearer-key routes (`/credits`, `/renders`, `/renders/{id}`) answer `OPTIONS` and attach CORS headers via `lib/api/v1/cors.ts`.

- **Allowlist:** `PUBLIC_API_CORS_ORIGINS=https://app.example.com,https://sandbox.example.com` reflects a matching `Origin`.
- **Default:** unset or `*` → `Access-Control-Allow-Origin: *` (fine for `Authorization: Bearer`; credentials are never enabled).
- **Allowed request headers:** `Authorization`, `Content-Type`, `X-API-Key`.
- **Exposed:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-Credits-Remaining`.

## Migration

Apply `supabase/migrations/20261108180000_public_api_v1.sql` and
`supabase/migrations/20261108235245_api_webhooks.sql` before enabling the routes in production.

## Create a key (signed-in browser)

```bash
# Cookie session from the app, Professional or Business plan
curl -X POST https://www.renderspace.ai/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name":"CI"}'
```

## Completion webhooks (phase 2 foundation)

Register an HTTPS endpoint with a signed-in Pro/Business session. Sync `POST /renders` is unchanged; after each render reaches `completed` or `failed`, Renderspace fire-and-forget POSTs to every active webhook.

```bash
curl -X POST https://www.renderspace.ai/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/hooks/renderspace"}'
```

Verify with `X-Renderspace-Signature: sha256=<hex>` — HMAC-SHA256 of the raw JSON body using the `whsec_…` secret returned once at creation (AES-GCM encrypted at rest with `API_KEY_PEPPER`). Delivery failures are logged and do not fail the render response. HTTPS only; localhost / private / metadata hosts are rejected.

## Ops: `API_KEY_PEPPER`

Server-only secret used when hashing API keys and encrypting webhook signing secrets (`lib/api/v1/keys.ts`, `lib/api/v1/webhooks.ts`). Checklist:

1. **Production:** set `API_KEY_PEPPER` in the Production environment (Vercel → Project → Settings → Environment Variables → Production). Prefer a dedicated random value; do not reuse client-visible secrets.
2. **Never `NEXT_PUBLIC_`:** this must stay server-only. A public pepper would let anyone forge key hashes offline.
3. **Rotation invalidates keys and webhook secrets:** changing the pepper changes every `key_hash` and breaks decryption of `api_webhooks.secret_encrypted`. Existing `rs_live_…` keys stop authenticating and webhook signatures cannot be produced until users create new keys/webhooks. Plan a revoke-and-reissue window before rotating.
4. **Preview:** use a **separate** Preview pepper, or leave it unset (falls back to Preview `SUPABASE_SERVICE_ROLE_KEY`). Do not copy the Production pepper into Preview — shared peppers couple Preview DB key rows to Production hashing.

## Verifying rate limits

Production is **fail-closed** without Upstash (`lib/api/v1/rateLimit.ts`): missing Redis URL/token or missing `UPSTASH_RATELIMIT_PREFIX` returns `configuration_error` (HTTP 503), not unlimited traffic.

### Missing Upstash → 503 `configuration_error`

1. In a non-Production sandbox (or temporarily without Redis vars), call any authenticated route, e.g. `GET /api/v1/credits` with a valid Bearer key.
2. Expect HTTP **503** and body `{ "error": { "code": "configuration_error", … } }` when Upstash is required but unset (Production).
3. Response may still include `X-RateLimit-*` headers with remaining `0`.

### With Upstash → `X-RateLimit-Remaining` decreases

1. Confirm Production (or Preview with Redis) has `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and an environment-specific `UPSTASH_RATELIMIT_PREFIX` (e.g. `api:production`).
2. Call `GET /api/v1/credits` twice with the same API key.
3. Check response headers: `X-RateLimit-Limit: 60`, `X-RateLimit-Remaining` drops by 1 on each successful call, and `X-RateLimit-Reset` is a unix timestamp.
4. After 60 calls in a minute, expect HTTP **429** `rate_limited` plus `Retry-After`. Limited requests emit a structured `public_api` warn log (see Observability).

## Observability (Vercel logs)

Public API routes emit **one JSON line per notable event** via `lib/api/v1/observability.ts`:

```json
{"source":"public_api","level":"error","route":"/api/v1/renders","status":500,"code":"internal_error","userIdHash":"abc123…","message":"…"}
```

- `source` is always `public_api` (safe filter key).
- `userIdHash` is a short SHA-256 prefix of the user id — **not** the raw UUID and never an API key.
- Levels: `error` for 5xx (`internal_error`, `configuration_error`, failed renders); `warn` when rate-limited or Upstash check fails closed.

### Filtering in Vercel

1. Open the deployment → **Logs**.
2. Filter / search for `public_api` or `"source":"public_api"`.
3. Narrow further with `"level":"error"` for 5xx, or `"code":"rate_limited"` for throttling.
4. Optional: pipe the same JSON to a log drain (Datadog, Axiom, etc.) and query `source:public_api status:>=500`.

### Credit consume failures (`credit_errors`)

Successful image generation that fails credit settlement already writes a row to the `credit_errors` table (`stage: "consume"` via `settleRenderCharge` / `logCreditError`). Use that table for billing integrity alerts; use `public_api` JSON logs for HTTP 5xx / rate-limit ops.

## Marketplace listing checklist

1. Apply migration + set `API_KEY_PEPPER`.
2. Publish OpenAPI (`public/openapi/v1.yaml`) and `/developers`.
3. RapidAPI — import OpenAPI, set base URL `/api/v1`, document Bearer auth. → `docs/marketplace/postman-rapidapi.md` (#9).
4. Postman — public workspace from OpenAPI. → same doc (#9). Keep `openapi/v1.yaml` ↔ `public/openapi/v1.yaml` in sync (2 credits, webhooks, CORS note).
5. n8n / Make / Albato — HTTP credential + sample workflow using `POST /renders`. → `docs/marketplace/n8n-make.md` (#10).
6. Composio / Cursor Directory / MCP — wrap the four tools after REST is stable. → `docs/marketplace/mcp-wrapper.md` + `lib/api/v1/mcp-tools.ts` (#11).
7. Add dashboard UI for key create/revoke (session routes already exist).
8. Phase 2 foundation: completion webhooks (done); optional async mode later.

Index: [`docs/marketplace/README.md`](./marketplace/README.md).
