import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getPrediction } from "@/lib/replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Normalized {
  id: string;
  status: "starting"|"processing"|"queued"|"succeeded"|"failed"|"canceled";
  output?: string[];
  error?: string | null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
    
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const pred = await getPrediction(id);
    
    if (DEV) console.log("[SpaceGen API] Prediction id:", id, "status:", pred.status);

    const outputArray =
      Array.isArray(pred.output) ? pred.output
      : pred.output ? [pred.output]
      : [];

    // attempt to update the render row when succeeded
    if (pred.status === "succeeded" && outputArray.length > 0) {
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      // best-effort update: find row by prediction_id inside config JSON
      await supabase
        .from("renders")
        .update({
          result_image_url: outputArray[0],
          // keep minimal status while preserving prediction_id
          config: { prediction_id: id, status: pred.status },
        })
        .contains("config", { prediction_id: id }); // JSON containment filter
    }

    const payload: Normalized = {
      id: pred.id,
      status: pred.status,
      output: outputArray,
      error: pred.error ?? null,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
    if (DEV) console.log("[SpaceGen API] Error:", e?.message || "Render status failed");
    return NextResponse.json({ error: e?.message || "Render status failed" }, { status: 502 });
  }
}
