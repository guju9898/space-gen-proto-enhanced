# Vercel deploy – avoiding build failures

Builds can fail when **environment variables or secrets are read at module load**. Vercel may not inject secrets (or all env vars) during the build step, so any top-level `throw` or required env read can break the build.

## Rule: no required env at module load

- **Do not** read `process.env.SECRET_KEY` (or similar) at the top of a route file and then `throw new Error(...)` if missing.
- **Do** read env **inside** the request handler (or inside a function that’s only called from the handler). If a secret is missing at runtime, return a **503** (or 500) from the handler instead of throwing at load time.

## Pattern used in this repo

```ts
// ❌ BAD – runs at module load, breaks build if env is unset
const token = process.env.REPLICATE_API_TOKEN
if (!token) throw new Error("Missing REPLICATE_API_TOKEN")
const client = new Replicate({ auth: token })

export async function POST(req: Request) { ... }
```

```ts
// ✅ GOOD – only runs when the route is hit
function getClient() {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return null
  return new Replicate({ auth: token })
}

export async function POST(req: Request) {
  const client = getClient()
  if (!client) {
    return NextResponse.json(
      { error: "Service not configured (missing REPLICATE_API_TOKEN)" },
      { status: 503 }
    )
  }
  // ...
}
```

## Routes already updated to this pattern

- `app/api/stripe/webhook/route.ts` – Stripe + Supabase init moved into handler
- `app/api/stripe/portal/route.ts` – Stripe init via `getStripe()` inside handler
- `app/api/stripe/checkout/route.ts` – same
- `app/api/generate-replicate/route.ts` – Replicate token read in handler
- `app/api/render/route.ts` – same
- `app/api/generate-interior/route.ts` – same

When adding new API routes that need secrets, use the same pattern so builds succeed even when env is not set at build time.
