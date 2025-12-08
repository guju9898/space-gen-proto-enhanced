import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const ref = url ? url.split("//")[1]?.split(".")[0] : null;
  const payload = {
    supabase: {
      url,
      ref,
      anon_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    stripe: {
      secret_present: !!process.env.STRIPE_SECRET_KEY,
      webhook_present: !!process.env.STRIPE_WEBHOOK_SECRET,
      domain: process.env.NEXT_PUBLIC_DOMAIN || "missing",
      prices: {
        personal: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_PERSONAL,
        pro: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
        business: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
        temp: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_TEMP,
      },
    },
  };
  return NextResponse.json(payload);
}




