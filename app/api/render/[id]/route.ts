import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/createRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(_req: Request, ctx: { params?: Record<string, string> }) {
  const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
  try {
    const rawParams = ctx?.params ?? {};
    if (DEV) console.log("[Status API] raw params:", rawParams);

    const predictionId = rawParams?.id;
    if (!predictionId || typeof predictionId !== "string") {
      return NextResponse.json({ error: "Missing or invalid prediction id" }, { status: 422 });
    }

    const supabase = await createRouteSupabase();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr && DEV) console.log("[Status API] auth.getUser error:", authErr.message);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prediction = await fetchPrediction(predictionId);
    const status: string = prediction?.status ?? "processing";

    let imageUrl: string | null = null;
    if (status === "succeeded") {
      const out = prediction.output;
      if (Array.isArray(out) && typeof out[0] === "string") imageUrl = out[0];
      else if (typeof out === "string") imageUrl = out;
      else if (out?.images && Array.isArray(out.images) && out.images[0]) imageUrl = out.images[0];
    }

    const { error: upsertErr } = await supabase
      .from("renders")
      .upsert(
        {
          user_id: user.id,
          prediction_id: predictionId,
          status,
          image_url: imageUrl,
        },
        { onConflict: "prediction_id" }
      );

    if (upsertErr && DEV) console.log("[Status API] renders upsert error:", upsertErr.message);
    if (DEV) console.log("[Status API] →", predictionId, status, imageUrl || "");

    return NextResponse.json(
      { id: predictionId, status, imageUrl },
      { status: 200 }
    );
  } catch (e: any) {
    const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
    if (DEV) console.log("[Status API] Error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Status check failed" }, { status: 502 });
  }
}