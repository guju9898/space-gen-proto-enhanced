import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params?: Record<string, string> }) {
  const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
  try {
    const rawParams = ctx?.params ?? {};
    if (DEV) console.log("[Download API] raw params:", rawParams);

    const renderId = rawParams?.id;
    if (!renderId || typeof renderId !== "string") {
      return NextResponse.json({ error: "Missing or invalid render id" }, { status: 422 });
    }

    // Auth user (RLS requires authenticated)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr && DEV) console.log("[Download API] auth.getUser error:", authErr.message);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the render to verify ownership and get image URL
    const { data: render, error: fetchErr } = await supabase
      .from("renders")
      .select("id, user_id, image_url, status")
      .eq("id", renderId)
      .single();

    if (fetchErr) {
      if (DEV) console.log("[Download API] fetch error:", fetchErr.message);
      return NextResponse.json({ error: "Render not found" }, { status: 404 });
    }

    // Verify ownership
    if (render.user_id !== user.id) {
      if (DEV) console.log("[Download API] ownership mismatch:", render.user_id, "vs", user.id);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if render is completed
    if (render.status !== "succeeded") {
      return NextResponse.json({ error: "Render not completed" }, { status: 400 });
    }

    // Check if image URL exists
    if (!render.image_url) {
      return NextResponse.json({ error: "No image available" }, { status: 404 });
    }

    // Check if it's a public HTTP(S) URL - if so, redirect
    try {
      const url = new URL(render.image_url);
      if (url.protocol === "http:" || url.protocol === "https:") {
        if (DEV) console.log("[Download API] → redirecting to:", render.image_url);
        return NextResponse.redirect(render.image_url);
      }
    } catch {
      // Not a valid URL, fall through to streaming
    }

    // For non-HTTP URLs (e.g., Supabase storage), stream the content
    try {
      const response = await fetch(render.image_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";

      if (DEV) console.log("[Download API] → streaming image, size:", imageBuffer.byteLength);

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": imageBuffer.byteLength.toString(),
          "Content-Disposition": `attachment; filename="render-${renderId}.${contentType.split("/")[1] || "jpg"}"`,
        },
      });
    } catch (streamErr) {
      if (DEV) console.log("[Download API] stream error:", streamErr);
      return NextResponse.json({ error: "Failed to download image" }, { status: 500 });
    }
  } catch (e: any) {
    const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";
    if (DEV) console.log("[Download API] Error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Download failed" }, { status: 502 });
  }
}
