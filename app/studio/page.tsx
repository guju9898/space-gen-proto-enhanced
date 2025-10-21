// ---- SERVER GUARD BLOCK (inserted) ----
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side guard helper:
 * - Redirect unauthenticated users to /auth/login
 * - Redirect authenticated but unsubscribed users to /pricing
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in server env.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyStudioAccessOrRedirect() {
  const token = cookies().get("sb-access-token")?.value;
  if (!token) {
    redirect("/auth/login?redirect=/studio");
  }

  const { data: userResult, error: userErr } = await supabaseAdmin.auth.getUser(token);
  const user = userResult?.user;
  if (userErr || !user) {
    redirect("/auth/login?redirect=/studio");
  }

  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  if (!subscription || subscription.status !== "active") {
    redirect("/pricing");
  }

  return user;
}
// ---- END SERVER GUARD BLOCK ----

export default async function StudioPage() {
  await verifyStudioAccessOrRedirect();
  redirect("/studio/interior")
}
