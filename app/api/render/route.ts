import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/createRouteClient";
import { createPrediction } from "@/lib/replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InputSchema = z.object({
  image: z.string().url(),
  prompt: z.string().min(3),
  type: z.string().optional().default("interior"),
  guidance_scale: z.number().min(1).max(50).optional(),
  negative_prompt: z.string().optional(),
  prompt_strength: z.number().min(0).max(1).optional(),
  num_inference_steps: z.number().min(1).max(500).optional(),
  seed: z.number().int().optional().nullable(),
});

const recentByIp = new Map<string, number>();

export async function POST(req: Request) {
  const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
  try {
    // ── Rate limit (local)
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "unknown";
    const now = Date.now();
    const last = recentByIp.get(ip) || 0;
    if (now - last < 1500) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    recentByIp.set(ip, now);

    // ── Validate input
    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;
    if (DEV) console.log("[SpaceGen API] Incoming image_url:", input.image);

    // ── Auth
    const supabase = await createRouteSupabase();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr && DEV) console.log("[SpaceGen API] auth.getUser error:", authErr.message);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Hardened HEAD preflight
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const headResponse = await fetch(input.image, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeoutId);

      if (!headResponse.ok) {
        return NextResponse.json(
          { error: `Image URL is not reachable (status ${headResponse.status})` },
          { status: 422 }
        );
      }
      const ct = headResponse.headers.get("content-type") || "";
      const cl = headResponse.headers.get("content-length") || "";
      if (!ct.toLowerCase().startsWith("image/")) {
        return NextResponse.json(
          { error: `URL does not point to an image file (content-type: ${ct || "unknown"})` },
          { status: 422 }
        );
      }
      if (cl && /^\d+$/.test(cl) && Number(cl) === 0) {
        return NextResponse.json(
          { error: "Image file appears to be empty (content-length: 0)" },
          { status: 422 }
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return NextResponse.json({ error: "Image URL is not reachable (timeout)" }, { status: 422 });
      }
      return NextResponse.json(
        { error: `Image URL is not reachable (${err?.message || "unknown error"})` },
        { status: 422 }
      );
    }

    // ── Create prediction
    const prediction = await createPrediction(input);
    if (DEV) console.log("[SpaceGen API] Prediction id:", prediction.id, "status:", prediction.status);

    // ── Immediate upsert so /my-renders can see the job
    const status = prediction?.status ?? "starting";
    const userId = user.id;
    const prompt = input?.prompt ?? null;
    const type = input?.type ?? "interior";

    const { data: upsertData, error: insertErr } = await supabase
      .from("renders")
      .upsert(
        {
          user_id: userId,
          prediction_id: prediction.id,   // requires column + unique index (partial ok)
          status,
          prompt,
          type,
          image_url: null,                 // will be filled by status route on success
        },
        { onConflict: "prediction_id" }
      )
      .select("id")
      .single()
      .throwOnError();                     // ← make failures loud

    if (DEV) console.log("[renders] upsert on create → row id:", upsertData?.id);

    // ── Return minimal payload to the UI
    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      prompt,
    });
  } catch (e: any) {
    const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
    if (DEV) console.log("[SpaceGen API] Error:", e?.message || "Render create failed");
    return NextResponse.json({ error: e?.message || "Render create failed" }, { status: 502 });
  }
}
