import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirectTo") || "/studio";

  try {
    if (code) {
      const supabase = await getSupabaseServerClient();
      // Works for magic links and OAuth (PKCE) because the cookies adapter
      // has access to the pkce verifier cookie when present.
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // Surface the reason to help debugging (you'll see it in the URL if it fails)
        url.searchParams.set("error", error.message);
        return NextResponse.redirect(url);
      }
    } else {
      url.searchParams.set("error", "missing_code");
      return NextResponse.redirect(url);
    }

    // Successful exchange -> go where the app wants
    const dest = new URL(redirectTo, url.origin);
    return NextResponse.redirect(dest);
  } catch (e: any) {
    url.searchParams.set("error", e?.message ?? "exchange_failed");
    return NextResponse.redirect(url);
  }
}



