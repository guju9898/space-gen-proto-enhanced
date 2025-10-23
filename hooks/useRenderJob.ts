"use client";
import { useState } from "react";
import { generateImageFromConfig } from "@/lib/api/generateImage";

export type RenderInput = {
  image: string;
  prompt: string;
  guidance_scale?: number;
  negative_prompt?: string;
  prompt_strength?: number;
  num_inference_steps?: number;
  seed?: number | null;
};

export function useRenderJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function run(input: RenderInput) {
    setError(null);
    setImageUrl(null);
    setLoading(true);
    try {
      const res = await generateImageFromConfig(input);
      if (res.timedOut) {
        // Don't set error - this is a non-fatal timeout
        return res; // { timedOut: true, id, prompt, timestamp }
      }
      setImageUrl(res.imageUrl);
      return res; // { imageUrl, prompt, timestamp }
    } catch (e: any) {
      setError(e?.message ?? "Render failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, imageUrl, run };
}
