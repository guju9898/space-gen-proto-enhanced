import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const DEMO_MODE_COOKIE = "renderspace_demo_mode"

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const demoModeCookie = cookieStore.get(DEMO_MODE_COOKIE)?.value === "1"

  if (demoModeCookie) {
    return <>{children}</>
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/?login=1")
  }

  return <>{children}</>
}
