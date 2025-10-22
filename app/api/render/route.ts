import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createPrediction } from "@/lib/replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InputSchema = z.object({
  image: z.string().url(),
  prompt: z.string().min(3),
  guidance_scale: z.number().min(1).max(50).optional(),
  negative_prompt: z.string().optional(),
  prompt_strength: z.number().min(0).max(1).optional(),
  num_inference_steps: z.number().min(1).max(500).optional(),
  seed: z.number().int().optional().nullable(),
});

// very light, local burst guard to avoid spam (replace with Upstash later)
const recentByIp = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "unknown";
    const now = Date.now();
    const last = recentByIp.get(ip) || 0;
    if (now - last < 1500) { // 1.5s min gap
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    recentByIp.set(ip, now);

    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Pre-flight HEAD check for image URL
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const headResponse = await fetch(input.image, {
        method: "HEAD",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!headResponse.ok) {
        return NextResponse.json(
          { error: `Image URL is not reachable (status ${headResponse.status})` },
          { status: 422 }
        );
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: "Image URL is not reachable (timeout)" },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: `Image URL is not reachable (${error.message})` },
        { status: 422 }
      );
    }

    const prediction = await createPrediction(input);

    // persist placeholder row (RLS: auth user can insert their own)
    await supabase.from("renders").insert({
      user_id: user.id,
      render_type: "interior",
      config: { input, prediction_id: prediction.id, status: prediction.status },
      source_image_url: input.image,
      result_image_url: null,
      prompt: input.prompt,
    });

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      created: prediction?.created_at ?? new Date().toISOString(),
      prompt: input.prompt,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Render create failed" }, { status: 502 });
  }
} 