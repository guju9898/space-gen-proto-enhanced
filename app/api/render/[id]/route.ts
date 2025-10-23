import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ParamsSchema = z.object({ id: z.string().min(6) });

/**
 * Replicate client—keep it simple to avoid extra imports
 */
async function fetchPrediction(predictionId: string) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("Missing REPLICATE_API_TOKEN");
  const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Replicate fetch failed (${res.status}): ${txt || res.statusText}`);
  }
  return res.json();
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
  try {
    // 0) Params
    const parsed = ParamsSchema.safeParse(ctx.params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid prediction id" }, { status: 400 });
    }
    const predictionId = parsed.data.id;

    // 1) Auth user (RLS requires authenticated)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr && DEV) console.log("[Status API] auth.getUser error:", authErr.message);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2) Replicate status
    const prediction = await fetchPrediction(predictionId);

    // Replicate status mapping
    const status: string = prediction?.status ?? "processing";
    // Handle output shape (array or string)
    let imageUrl: string | null = null;
    if (status === "succeeded") {
      const out = prediction.output;
      if (Array.isArray(out) && out.length > 0 && typeof out[0] === "string") {
        imageUrl = out[0];
      } else if (typeof out === "string") {
        imageUrl = out;
      } else if (out?.images && Array.isArray(out.images) && out.images[0]) {
        imageUrl = out.images[0];
      }
    }

    // 3) Self-healing upsert on every poll so /my-renders always sees it
    //    Requires columns: user_id, prediction_id, status, image_url, prompt, type
    const { error: upsertErr } = await supabase
      .from("renders")
      .upsert(
        {
          user_id: user.id,
          prediction_id: predictionId,
          status,
          image_url: imageUrl, // null until succeeded
          // leave prompt/type untouched if your schema doesn't require them here
        },
        { onConflict: "prediction_id" }
      );

    if (upsertErr && DEV) console.log("[Status API] renders upsert error:", upsertErr.message);
    if (DEV) console.log("[Status API] prediction:", predictionId, "→", status, imageUrl || "");

    // 4) Respond to UI
    return NextResponse.json({
      id: predictionId,
      status,
      imageUrl,
      raw: DEV ? prediction : undefined,
    }, { status: 200 });
  } catch (e: any) {
    const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
    if (DEV) console.log("[Status API] Error:", e?.message || "Status check failed");
    return NextResponse.json({ error: e?.message || "Status check failed" }, { status: 502 });
  }
}