import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  requireHumanPolishAdmin,
  type HumanPolishAdminAuthSuccess,
} from "@/lib/human-polish/admin-auth"

/**
 * Gate admin pages: login redirect for anonymous users; forbidden UI for others.
 * Mutations must still call requireHumanPolishAdmin independently.
 */
export async function requireHumanPolishAdminPage(
  returnPath: string
): Promise<HumanPolishAdminAuthSuccess | { forbidden: true; error: string }> {
  const auth = await requireHumanPolishAdmin()

  if (!auth.ok && auth.code === "unauthenticated") {
    const cookieStore = await cookies()
    cookieStore.set("auth_redirect_next", returnPath, {
      path: "/",
      maxAge: 600,
      sameSite: "lax",
    })
    redirect("/?login=1")
  }

  if (!auth.ok) {
    return { forbidden: true, error: auth.error }
  }

  return auth
}
