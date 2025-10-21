import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function StudioPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    redirect("/auth/login?redirect=/studio");
  }

  // Check subscription status using admin client
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscription || subscription.status !== "active") {
    redirect("/pricing");
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-medium">Studio</h1>
      <p>Welcome to the studio, {user.email}!</p>
      <div className="mt-4">
        <a href="/studio/interior" className="text-blue-500 hover:underline">
          Go to Interior Design →
        </a>
      </div>
    </div>
  );
}
