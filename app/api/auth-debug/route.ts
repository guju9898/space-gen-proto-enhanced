import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    // Extract project ref from URL
    let projectRef = "unknown";
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl);
        projectRef = url.hostname.split(".")[0];
      } catch {
        projectRef = "invalid-url";
      }
    }

    // Test Supabase health endpoint
    let health = { ok: false, status: 0, json: null };
    let error = null;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const healthUrl = `${supabaseUrl}/auth/v1/health`;
        const response = await fetch(healthUrl, {
          method: "GET",
          headers: {
            "apikey": supabaseAnonKey,
            "Content-Type": "application/json",
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        const json = await response.json().catch(() => null);
        health = {
          ok: response.ok,
          status: response.status,
          json,
        };
      } catch (err: any) {
        error = {
          message: err.message,
          name: err.name,
          code: err.code,
        };
      }
    } else {
      error = {
        message: "Missing Supabase URL or anon key",
        missing: {
          url: !supabaseUrl,
          anonKey: !supabaseAnonKey,
        },
      };
    }

    return NextResponse.json({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 8)}...` : null,
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? `${serviceRoleKey.substring(0, 8)}...` : null,
        NEXTAUTH_URL: nextAuthUrl,
      },
      projectRef,
      health,
      error,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message: err.message,
          name: err.name,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
