import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site/SiteFooter"

export const metadata: Metadata = {
  title: "Developers — Renderspace API",
  description: "Public REST API for generating photorealistic design concepts from job-site photos.",
  alternates: { canonical: "https://www.renderspace.ai/developers" },
}

const curlExample = `curl -X POST https://www.renderspace.ai/api/v1/renders \\
  -H "Authorization: Bearer rs_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "space_type": "landscape",
    "image_url": "https://example.com/yard.jpg",
    "instruction": "Modern backyard with a linear pool and warm evening light"
  }'`

const jsExample = `const res = await fetch("https://www.renderspace.ai/api/v1/renders", {
  method: "POST",
  headers: {
    Authorization: "Bearer rs_live_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    space_type: "exterior",
    image_url: "https://example.com/house.jpg",
    instruction: "Paint the house warm limestone with black window frames",
  }),
});
const render = await res.json();`

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-[#0b0d10] text-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-white">
            Renderspace
          </Link>{" "}
          / Developers
        </p>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">Public API</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Generate photorealistic landscape, exterior, and interior concepts from a job-site photo.
          API access requires an active Professional or Business plan. Each successful render uses 1
          credit.
        </p>

        <section className="space-y-4 mb-12">
          <h2 className="text-xl font-medium">1. Create an API key</h2>
          <p className="text-muted-foreground">
            Sign in on renderspace.ai with a Professional or Business account, then:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-black/50 p-4 text-sm text-zinc-200">
            {`POST /api/v1/keys
{ "name": "Production" }

# Response includes api_key once — store it securely.`}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-xl font-medium">2. Authenticate</h2>
          <pre className="overflow-x-auto rounded-lg bg-black/50 p-4 text-sm text-zinc-200">
            {`Authorization: Bearer rs_live_…`}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-xl font-medium">3. Create a render</h2>
          <p className="text-muted-foreground">
            Pass natural language in <code className="text-zinc-200">instruction</code>. The API
            structures it into Studio-like options, then generates synchronously (~20–40 seconds).
          </p>
          <pre className="overflow-x-auto rounded-lg bg-black/50 p-4 text-sm text-zinc-200 whitespace-pre-wrap">
            {curlExample}
          </pre>
          <pre className="overflow-x-auto rounded-lg bg-black/50 p-4 text-sm text-zinc-200 whitespace-pre-wrap">
            {jsExample}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-xl font-medium">Endpoints</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <code className="text-zinc-200">GET /api/v1/credits</code> — remaining credits
            </li>
            <li>
              <code className="text-zinc-200">POST /api/v1/renders</code> — create render (sync)
            </li>
            <li>
              <code className="text-zinc-200">GET /api/v1/renders</code> — list recent renders
            </li>
            <li>
              <code className="text-zinc-200">GET /api/v1/renders/{"{id}"}</code> — fetch one render
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-xl font-medium">OpenAPI</h2>
          <p className="text-muted-foreground">
            Machine-readable spec for RapidAPI, Postman, n8n, Make, and Composio:{" "}
            <a className="text-white underline" href="/openapi/v1.yaml">
              /openapi/v1.yaml
            </a>
          </p>
        </section>
      </div>
      <SiteFooter />
    </main>
  )
}
