export interface RenderRequestConfig {
  image: string;
  prompt: string;
  guidance_scale?: number;
  negative_prompt?: string;
  prompt_strength?: number;
  num_inference_steps?: number;
  seed?: number | null;
}

export async function generateImageFromConfig(config: RenderRequestConfig) {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to create render job");
  }
  const { id, status, prompt } = await res.json();
  if (!id) throw new Error("No prediction id returned");

  const started = Date.now();
  let out: string[] = [];
  while (Date.now() - started < 60000) {
    const r = await fetch(`/api/render/${id}`);
    const data = await r.json();
    if (data.status === "succeeded" && data.output?.length) {
      out = data.output;
      break;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || "Render failed");
    }
    await new Promise((s) => setTimeout(s, 2000));
  }
  if (!out.length) throw new Error("Render is taking longer than expected. Please try again shortly.");

  return {
    imageUrl: out[0],
    prompt,
    timestamp: new Date().toISOString(),
  };
}