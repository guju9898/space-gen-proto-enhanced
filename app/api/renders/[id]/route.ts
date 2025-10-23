import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params?: Record<string, string> }) {
  const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
  try {
    const rawParams = ctx?.params ?? {};
    if (DEV) console.log("[Delete API] raw params:", rawParams);

    const renderId = rawParams?.id;
    if (!renderId || typeof renderId !== "string") {
      return NextResponse.json({ error: "Missing or invalid render id" }, { status: 422 });
    }

    // Auth user (RLS requires authenticated)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr && DEV) console.log("[Delete API] auth.getUser error:", authErr.message);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the render to verify ownership
    const { data: render, error: fetchErr } = await supabase
      .from("renders")
      .select("id, user_id")
      .eq("id", renderId)
      .single();

    if (fetchErr) {
      if (DEV) console.log("[Delete API] fetch error:", fetchErr.message);
      return NextResponse.json({ error: "Render not found" }, { status: 404 });
    }

    // Verify ownership
    if (render.user_id !== user.id) {
      if (DEV) console.log("[Delete API] ownership mismatch:", render.user_id, "vs", user.id);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the render
    const { error: deleteErr } = await supabase
      .from("renders")
      .delete()
      .eq("id", renderId)
      .eq("user_id", user.id); // Double-check ownership

    if (deleteErr) {
      if (DEV) console.log("[Delete API] delete error:", deleteErr.message);
      return NextResponse.json({ error: "Failed to delete render" }, { status: 500 });
    }

    if (DEV) console.log("[Delete API] → deleted render:", renderId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
    if (DEV) console.log("[Delete API] Error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 502 });
  }
}
