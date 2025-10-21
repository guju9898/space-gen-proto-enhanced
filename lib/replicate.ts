const API = "https://api.replicate.com/v1";
const TOKEN = process.env.REPLICATE_API_TOKEN!;
const VERSION = process.env.REPLICATE_VERSION || "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38";

if (!TOKEN) throw new Error("Missing REPLICATE_API_TOKEN");

export type ReplicateStatus = "starting"|"processing"|"queued"|"succeeded"|"failed"|"canceled";

export interface ReplicateInput {
  image: string;
  prompt: string;
  guidance_scale?: number;
  negative_prompt?: string;
  prompt_strength?: number;
  num_inference_steps?: number;
  seed?: number | null;
}

export async function createPrediction(input: ReplicateInput) {
  const body = {
    version: VERSION,
    input,
  };
  const res = await fetch(`${API}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Replicate create failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<{ id: string; status: ReplicateStatus; created_at?: string }>;
}

export async function getPrediction(id: string) {
  const res = await fetch(`${API}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const err = await res.text();
   throw new Error(`Replicate get failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<{
    id: string;
    status: ReplicateStatus;
    output?: string | string[] | null;
    error?: string | null;
    metrics?: unknown;
  }>;
}
