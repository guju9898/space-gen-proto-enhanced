import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { USAGE_RIGHTS } from "@/lib/seo/facts"
import { API_RENDER_CREDIT_COST } from "@/lib/usage/creditCost"

export const metadata: Metadata = {
  title: "Developers — Renderspace API",
  description:
    "Public REST API for generating photorealistic landscape, exterior, and interior concepts from a job-site photo.",
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

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active="developers" />
      <main>
        <section className="border-b border-[#2a2a2a]">
          <div className="container mx-auto px-4 py-14 md:py-20 grid gap-10 lg:grid-cols-2 lg:gap-14 items-center">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Public API</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
                Photo in. Concept out.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-6">
                Turn a job-site photo into a photorealistic design concept from your own tools.
                Natural-language instructions are structured on our servers. Professional and
                Business plans only. Each successful API render uses {API_RENDER_CREDIT_COST} credits.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
                >
                  Create API key
                </Link>
                <a
                  href="/openapi/v1.yaml"
                  className="inline-flex items-center rounded-md border border-[#343434] px-4 py-2 text-sm text-white hover:bg-white/5"
                >
                  OpenAPI spec
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <figure className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#343434]">
                <Image
                  src="/gallery/exterior-before.jpg"
                  alt="Job-site exterior photo before redesign"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                  priority
                />
                <figcaption className="absolute bottom-0 inset-x-0 bg-black/55 px-3 py-1.5 text-xs text-zinc-200">
                  Before
                </figcaption>
              </figure>
              <figure className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#343434]">
                <Image
                  src="/gallery/exterior-after.jpg"
                  alt="Photorealistic exterior concept generated in Renderspace"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                  priority
                />
                <figcaption className="absolute bottom-0 inset-x-0 bg-black/55 px-3 py-1.5 text-xs text-zinc-200">
                  After
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14 md:py-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">Try a request</h2>
            <p className="text-muted-foreground mb-4">
              Authenticate with a key from your{" "}
              <Link href="/profile" className="underline hover:text-white">
                profile
              </Link>
              . Pass an image URL or multipart upload plus a natural-language instruction.
            </p>
            <pre className="overflow-x-auto rounded-lg border border-[#343434] bg-[#0b0d10] p-4 text-xs md:text-sm text-zinc-200 whitespace-pre-wrap">
              {curlExample}
            </pre>
          </div>

          <div className="rounded-lg border border-[#343434] bg-[#14161c] p-6">
            <h2 className="text-2xl font-semibold text-white mb-3">Get a key</h2>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
              <li>Use an active Professional or Business subscription.</li>
              <li>
                Open{" "}
                <Link href="/profile" className="underline hover:text-white">
                  Profile → API Keys
                </Link>
                .
              </li>
              <li>Create a key and store the secret — it is shown once.</li>
              <li>
                Send <code className="text-zinc-200">Authorization: Bearer rs_live_…</code>
              </li>
            </ol>
            <Link
              href="/profile"
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
            >
              Open profile
            </Link>
          </div>
        </section>

        <section className="border-t border-[#2a2a2a]">
          <div className="container mx-auto px-4 py-14 md:py-16">
            <h2 className="text-2xl font-semibold text-white mb-6">Endpoints</h2>
            <div className="overflow-x-auto rounded-lg border border-[#343434]">
              <table className="w-full text-sm">
                <thead className="bg-[#14161c] text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Path</th>
                    <th className="px-4 py-3 font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-200">
                  <tr className="border-t border-[#2a2a2a]">
                    <td className="px-4 py-3 font-mono text-xs">GET</td>
                    <td className="px-4 py-3 font-mono text-xs">/api/v1/credits</td>
                    <td className="px-4 py-3 text-muted-foreground">Remaining credits</td>
                  </tr>
                  <tr className="border-t border-[#2a2a2a]">
                    <td className="px-4 py-3 font-mono text-xs">POST</td>
                    <td className="px-4 py-3 font-mono text-xs">/api/v1/renders</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Create a render (sync, {API_RENDER_CREDIT_COST} credits)
                    </td>
                  </tr>
                  <tr className="border-t border-[#2a2a2a]">
                    <td className="px-4 py-3 font-mono text-xs">GET</td>
                    <td className="px-4 py-3 font-mono text-xs">/api/v1/renders</td>
                    <td className="px-4 py-3 text-muted-foreground">List recent renders</td>
                  </tr>
                  <tr className="border-t border-[#2a2a2a]">
                    <td className="px-4 py-3 font-mono text-xs">GET</td>
                    <td className="px-4 py-3 font-mono text-xs">/api/v1/renders/{"{id}"}</td>
                    <td className="px-4 py-3 text-muted-foreground">Fetch one render</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Machine-readable contract:{" "}
              <a href="/openapi/v1.yaml" className="underline hover:text-white">
                /openapi/v1.yaml
              </a>
            </p>
          </div>
        </section>

        <section className="border-t border-[#2a2a2a]">
          <div className="container mx-auto px-4 py-14 md:py-16 max-w-3xl">
            <h2 className="text-2xl font-semibold text-white mb-3">Terms &amp; commercial use</h2>
            <p className="text-muted-foreground mb-4">
              API access requires an active Professional or Business plan. Each successful API
              render costs {API_RENDER_CREDIT_COST} credits.
            </p>
            <p className="text-muted-foreground">
              API renders inherit your paid-plan commercial license. {USAGE_RIGHTS}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
