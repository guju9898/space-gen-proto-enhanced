import { redirect } from "next/navigation"
import { buildLoginRedirectHref } from "@/lib/auth/safe-return-path"
import {
  requireHumanPolishAdmin,
  type HumanPolishAdminAuthSuccess,
} from "@/lib/human-polish/admin-auth"

/**
 * Gate admin pages: login redirect for anonymous users; forbidden UI for others.
 * Mutations must still call requireHumanPolishAdmin independently.
 *
 * Does not mutate cookies during Server Component render (Next.js forbids it).
 * Return path is carried via a validated `next` query param on /?login=1.
 */
export async function requireHumanPolishAdminPage(
  returnPath: string
): Promise<HumanPolishAdminAuthSuccess | { forbidden: true; error: string }> {
  const auth = await requireHumanPolishAdmin()

  if (!auth.ok && auth.code === "unauthenticated") {
    redirect(buildLoginRedirectHref(returnPath))
  }

  if (!auth.ok) {
    return { forbidden: true, error: auth.error }
  }

  return auth
}
