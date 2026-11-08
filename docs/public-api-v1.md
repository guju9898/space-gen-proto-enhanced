# Renderspace Public API v1

## Status

Implemented on branch `feat/public-api-v1`.

## Env vars

| Var | Purpose |
| --- | --- |
| `API_KEY_PEPPER` | Optional pepper for hashing API keys. Falls back to `SUPABASE_SERVICE_ROLE_KEY` if unset — set a dedicated pepper in production. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` / `UPSTASH_RATELIMIT_PREFIX` | Required in production for `/api/v1/*` rate limits (60 req/min/key). |
| Existing generation vars | `OPENROUTER_API_KEY`, `REPLICATE_API_TOKEN`, Supabase URL + service role |

## Migration

Apply `supabase/migrations/20261108180000_public_api_v1.sql` before enabling the routes in production.

## Create a key (signed-in browser)

```bash
# Cookie session from the app, Professional or Business plan
curl -X POST https://www.renderspace.ai/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name":"CI"}'
```

## Marketplace listing checklist

1. Apply migration + set `API_KEY_PEPPER`.
2. Publish OpenAPI (`public/openapi/v1.yaml`) and `/developers`.
3. RapidAPI — import OpenAPI, set base URL `/api/v1`, document Bearer auth.
4. Postman — public workspace from OpenAPI.
5. n8n / Make / Albato — HTTP credential + sample workflow using `POST /renders`.
6. Composio / Cursor Directory / MCP — wrap the four tools after REST is stable.
7. Add dashboard UI for key create/revoke (session routes already exist).
8. Optional phase 2: completion webhooks + async mode.
