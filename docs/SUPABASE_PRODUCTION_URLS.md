# Supabase URLs for renderspace.ai (Production)

Use these in your Supabase project under **Authentication → URL Configuration**.

**Testing:** The magic link in the email always points to your **configured** redirect URL (production or localhost). To test the full flow (click link in email → land on studio), use **renderspace.ai** with the production URLs below. For local testing, add `http://localhost:3000` and `http://localhost:3000/auth/callback` to Redirect URLs and set Site URL to `http://localhost:3000` when testing locally.

## Site URL

```
https://renderspace.ai
```

Set this as the **Site URL**. This is the default origin Supabase uses for redirects.

## Redirect URLs

Add these to **Redirect URLs** (one per line or comma-separated, depending on Supabase UI):

```
https://renderspace.ai/auth/callback
https://www.renderspace.ai/auth/callback
```

- **`https://renderspace.ai/auth/callback`** — Required for magic link and OAuth (Google) when users use the canonical domain.
- **`https://www.renderspace.ai/auth/callback`** — Add this if you serve the app on `www.renderspace.ai` as well.

After login, users are sent to the `next` path (e.g. `/studio/interior`, `/studio/exterior`) via the callback route, so you do **not** need to list every studio path in Redirect URLs—only the callback URL.

## Summary

| Setting        | Value                                      |
|----------------|--------------------------------------------|
| **Site URL**   | `https://renderspace.ai`                    |
| **Redirect URLs** | `https://renderspace.ai/auth/callback`  |
| *(optional)*  | `https://www.renderspace.ai/auth/callback` |
