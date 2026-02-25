import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/?login=1")
  }

  return <>{children}</>
}
