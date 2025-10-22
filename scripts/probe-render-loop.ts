/* scripts/probe-render-loop.ts
   Node script to POST /api/render then poll /api/render/:id until "succeeded".
   Assumptions:
   - Dev server on http://localhost:3000
   - You can pass a public image URL via CLI arg or env
   - If auth cookie is required for your API, add it in HEADERS_COOKIE below.
*/
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const IMAGE = process.env.PROBE_IMAGE ?? process.argv[2] ?? "https://picsum.photos/seed/sg/1024/768";
const HEADERS_COOKIE = process.env.PROBE_COOKIE ?? ""; // e.g., "sb:token=...;"

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (HEADERS_COOKIE) h["Cookie"] = HEADERS_COOKIE;
  return h;
}

async function main() {
  console.log("[probe] POST /api/render");
  const res = await fetch(`${BASE}/api/render`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      image: IMAGE,
      prompt: "modern living room, clean design, professional interior rendering",
      guidance_scale: 15,
      prompt_strength: 0.8,
      num_inference_steps: 50,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[probe] POST failed", res.status, body);
    process.exit(1);
  }

  const id = body?.id || body?.prediction?.id;
  if (!id) {
    console.error("[probe] No prediction id returned", body);
    process.exit(1);
  }
  console.log("[probe] prediction id:", id);

  // poll
  for (let i = 0; i < 90; i++) {
    const g = await fetch(`${BASE}/api/render/${id}`, { headers: headers() });
    const jb = await g.json().catch(() => ({}));
    const status = jb?.status || jb?.prediction?.status;
    console.log(`[probe] poll #${i + 1}:`, status);
    if (status === "succeeded") {
      console.log("[probe] SUCCESS", jb?.output ?? jb?.prediction?.output);
      process.exit(0);
    }
    if (status === "failed" || status === "canceled") {
      console.error("[probe] FAILED", jb);
      process.exit(2);
    }
    await sleep(3000);
  }
  console.error("[probe] Timeout waiting for success");
  process.exit(3);
}

main().catch((e) => {
  console.error("[probe] Uncaught error", e);
  process.exit(99);
});
