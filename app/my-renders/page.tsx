import { redirect } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";
import { getUserRenders } from "@/lib/data/getUserRenders";
import type { RenderRow } from "@/lib/types/renders";
import { RendersDashboard } from "@/components/Renders/RendersDashboard";
import { ToastProvider } from "@/components/toast/ToastProvider";

export default async function MyRendersPage() {
  // Get authenticated user
  const supabase = await createRouteSupabase();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/sign-in?redirectTo=/my-renders");
  }

  // Fetch initial renders (latest 24)
  const { data: initial, error: rendersError } = await getUserRenders(supabase, user.id, {
    limit: 24,
    offset: 0,
  });

  if (rendersError) {
    console.error("Failed to fetch initial renders:", rendersError);
  }

  return (
    <ToastProvider>
      <RendersDashboard userId={user.id} initial={initial || []} />
    </ToastProvider>
  );
}