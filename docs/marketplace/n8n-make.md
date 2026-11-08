# n8n & Make.com workflows

Sample automation patterns against the live REST API. Create your own Renderspace API key from Profile → API Keys (Professional or Business). Each successful render costs **2 credits**. Prefer the sync `POST /renders` response; optional completion webhooks can also be registered from a signed-in session.

Base URL: `https://www.renderspace.ai/api/v1`

## Shared credential

| Field | Value |
| --- | --- |
| Type | HTTP Header / Bearer |
| Header | `Authorization` |
| Value | `Bearer rs_live_YOUR_KEY` |

Optional alternate: header `X-API-Key` = `rs_live_YOUR_KEY` (no `Bearer` prefix).

## n8n — concrete workflow

**Goal:** take a public image URL + instruction → call `POST /renders` → write `image_url` to the next node.

### Nodes

1. **Manual Trigger** (or Webhook / Schedule).
2. **Set** (optional) — normalize fields:
   - `space_type` → `landscape` | `exterior` | `interior`
   - `image_url` → HTTPS URL of the job-site photo
   - `instruction` → natural-language brief
3. **HTTP Request**
   - Method: `POST`
   - URL: `https://www.renderspace.ai/api/v1/renders`
   - Authentication: **Header Auth** or Generic Credential →  
     `Authorization` = `Bearer {{$credentials.renderspaceApi.apiKey}}`
   - Body Content Type: JSON
   - Body:

```json
{
  "space_type": "{{$json.space_type}}",
  "image_url": "{{$json.image_url}}",
  "instruction": "{{$json.instruction}}"
}
```

   - Options: timeout ≥ **120s** (generation is synchronous).
4. **Set / Code** — parse the result:
   - `render_id` ← `{{$json.id}}`
   - `status` ← `{{$json.status}}`
   - `image_url` ← `{{$json.image_url}}`
   - `credits_charged` ← `{{$json.credits.charged}}` (expect `2` on success)
5. Downstream — email the URL, save to Drive, post to Slack, etc. Only continue if `status === "completed"` and `image_url` is non-null.

### Minimal HTTP Request (no expressions)

```http
POST https://www.renderspace.ai/api/v1/renders
Authorization: Bearer rs_live_YOUR_KEY
Content-Type: application/json

{
  "space_type": "landscape",
  "image_url": "https://example.com/yard.jpg",
  "instruction": "Modern backyard with a linear pool and warm evening light"
}
```

Example success fields:

```json
{
  "id": "…",
  "status": "completed",
  "image_url": "https://…",
  "credits": { "charged": 2 }
}
```

### Optional nodes

- **HTTP Request** `GET /api/v1/credits` before create — skip if `credits_remaining < 2`.
- **HTTP Request** `GET /api/v1/renders/{{id}}` — only needed if you already stored an id; create itself returns the final image.

## Make.com — module outline

| # | Module | Config |
| --- | --- | --- |
| 1 | Trigger | Webhook, Watch records, or Scheduler |
| 2 | Tools → Set variables | `space_type`, `image_url`, `instruction` |
| 3 | HTTP → Make a request | See below |
| 4 | JSON → Parse JSON | Only if response is treated as text |
| 5 | Tools → Set variable | `result_image` = `image_url` from response |
| 6 | Downstream | Email / Slack / Google Drive / CRM |

### Module 3 — HTTP details

- **URL:** `https://www.renderspace.ai/api/v1/renders`
- **Method:** POST
- **Headers:**
  - `Authorization`: `Bearer rs_live_YOUR_KEY`
  - `Content-Type`: `application/json`
- **Body type:** Raw / JSON — same payload as the n8n example
- **Timeout:** increase above the default (generation can approach 2 minutes)
- **Parse response:** yes — map `image_url` for later modules

### Error handling (Make)

- `401` / `403` → fix key or plan
- `402` → top up credits (need ≥ 2)
- `422` → bad `space_type`, missing `image_url` / instruction
- `429` → back off (60/min per key)
- `500` with body `status: failed` → inspect `error`; no charge assumption — check `credits.charged`

## Notes for marketplace templates

- Call from Make/n8n cloud (server-side). Browser CORS is available on Bearer routes if you set `PUBLIC_API_CORS_ORIGINS` (or leave unset for `*`).
- Do not put API keys in scenario blueprints you publish publicly — use connection credentials.
- Document the **2 credit** cost in the template description.
