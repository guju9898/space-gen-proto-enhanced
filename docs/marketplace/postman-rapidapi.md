# Postman & RapidAPI listing notes

Repository artifacts for marketplace publishing. This does **not** create a RapidAPI or Postman account — use these steps when you are ready to list.

## Spec source of truth

| File | Role |
| --- | --- |
| `openapi/v1.yaml` | Canonical OpenAPI (edit here first) |
| `public/openapi/v1.yaml` | Served at `https://www.renderspace.ai/openapi/v1.yaml` |

Keep both files **byte-identical**. After any API change, update both and re-import into Postman / RapidAPI.

Human docs: [Developers](https://www.renderspace.ai/developers) · internal notes in `docs/public-api-v1.md`.

## Facts to put on the listing

- **Base URL:** `https://www.renderspace.ai/api/v1`
- **Auth:** `Authorization: Bearer rs_live_…` (or `X-API-Key: rs_live_…`)
- **Credits:** successful `POST /renders` costs **2 credits**
- **Webhooks:** none in v1 (sync HTTP response only)
- **CORS:** Bearer routes support CORS (`PUBLIC_API_CORS_ORIGINS` or `*`); cookie routes are same-origin
- **Rate limit:** 60 req/min/key

## Postman — public workspace from OpenAPI

1. Open Postman → **Import** → **Link** (or File) → paste  
   `https://www.renderspace.ai/openapi/v1.yaml`  
   (or import `public/openapi/v1.yaml` from this repo).
2. Confirm collection base URL is `https://www.renderspace.ai/api/v1` (OpenAPI `servers[0]`).
3. Collection auth: **Bearer Token**. Store the key in a collection variable, e.g. `{{rs_api_key}}`. Do not commit real keys.
4. Create a public workspace (or team workspace marked public) named something like **Renderspace API**.
5. Pin a sample request for `POST /renders`:

```json
{
  "space_type": "landscape",
  "image_url": "https://example.com/yard.jpg",
  "instruction": "Modern backyard with a linear pool and warm evening light"
}
```

6. Document in the workspace description: 2-credit charge, sync renders + optional webhooks, CORS on Bearer routes.
7. Optional: publish a Postman Collection link from the workspace **Share** / **Publish** flow for the marketing site.

### Smoke check

- `GET {{baseUrl}}/credits` → `200` with `credits_remaining`
- `POST {{baseUrl}}/renders` with a public HTTPS image → `201` and `image_url` populated when generation succeeds

## RapidAPI — import OpenAPI

1. In the RapidAPI Hub provider dashboard, create (or open) the Renderspace API project.
2. **Import OpenAPI** from `https://www.renderspace.ai/openapi/v1.yaml`.
3. Set the upstream / base URL to `https://www.renderspace.ai/api/v1` (path prefix already includes `/api/v1` — do not double it).
4. Auth mapping:
   - Prefer forwarding **Bearer** `Authorization` to origin, **or**
   - Map RapidAPI’s customer key header into `Authorization: Bearer …` / `X-API-Key` if you issue Renderspace keys out-of-band.
5. Listing copy should state:
   - Professional / Business Renderspace subscription required for keys created in-product
   - **2 credits** per successful render against the subscriber’s Renderspace balance
   - Sync `POST /renders`; optional completion webhooks
   - Browser CORS supported on Bearer routes when configured
6. Exclude or mark `/keys` as dashboard-only (session cookie) so marketplace consumers do not treat it as a Bearer endpoint.
7. After each OpenAPI bump: re-import, diff endpoints, republish the version.

## After you change the API

1. Edit `openapi/v1.yaml`, copy to `public/openapi/v1.yaml`.
2. Redeploy so `/openapi/v1.yaml` updates.
3. Re-import Postman collection + RapidAPI definition.
4. Re-run the smoke checks above.
