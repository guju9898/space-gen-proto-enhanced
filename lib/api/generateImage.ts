import { fetchWithRetryPost, fetchWithRetryJson } from "./fetchWithRetry";
import { logImageDebug } from "@/lib/debug/imageDebug";

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
  // Create render job with retry
  const { id, status, prompt } = await fetchWithRetryPost<{
    id: string;
    status: string;
    prompt: string;
  }>("/api/render", config);
  
  if (!id) throw new Error("No prediction id returned");

  const started = Date.now();
  let out: string[] = [];
  while (Date.now() - started < 180000) {
    // Poll status with retry
    const data = await fetchWithRetryJson<{
      id: string;
      status: string;
      imageUrl?: string;
      error?: string;
    }>(`/api/render/${id}`);
    
    if (data.status === "succeeded" && data.imageUrl) {
      console.log("✅ Render succeeded, got imageUrl:", data.imageUrl);
      logImageDebug(data.imageUrl, "Generated Image");
      out = [data.imageUrl];
      break;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || "Render failed");
    }
    await new Promise((s) => setTimeout(s, 2500));
  }
  if (!out.length) {
    return {
      timedOut: true,
      id,
      prompt,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    imageUrl: out[0],
    prompt,
    timestamp: new Date().toISOString(),
  };
}