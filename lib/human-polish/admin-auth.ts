/**
 * Human Polish admin authorization — server-only.
 *
 * Allowlist: HUMAN_POLISH_ADMIN_EMAILS (comma-separated).
 * Never import from client components. Never use NEXT_PUBLIC_* for the allowlist.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export type HumanPolishAdminAuthSuccess = {
  ok: true
  user: User
  email: string
  supabase: SupabaseClient
}

export type HumanPolishAdminAuthFailure = {
  ok: false
  status: 401 | 403 | 503
  error: string
  code: "unauthenticated" | "forbidden" | "not_configured"
}

export type HumanPolishAdminAuthResult =
  | HumanPolishAdminAuthSuccess
  | HumanPolishAdminAuthFailure

/** Normalize emails for allowlist comparison (trim + lowercase). */
export function normalizeAdminEmail(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Parse HUMAN_POLISH_ADMIN_EMAILS (comma-separated).
 * Empty / missing → empty allowlist (fail closed).
 */
export function parseHumanPolishAdminEmails(
  raw: string | undefined | null = process.env.HUMAN_POLISH_ADMIN_EMAILS
): Set<string> {
  if (typeof raw !== "string" || !raw.trim()) return new Set()
  return new Set(
    raw
      .split(",")
      .map((part) => normalizeAdminEmail(part))
      .filter((email) => email.includes("@"))
  )
}

export function isHumanPolishAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowlist = parseHumanPolishAdminEmails()
  if (allowlist.size === 0) return false
  return allowlist.has(normalizeAdminEmail(email))
}

/**
 * Require a signed-in Supabase user on the admin allowlist, plus a service-role client.
 * Call at the start of every admin page load and every admin server action.
 */
export async function requireHumanPolishAdmin(): Promise<HumanPolishAdminAuthResult> {
  const supabaseUserClient = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabaseUserClient.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required.",
      code: "unauthenticated",
    }
  }

  const email = user.email
  if (!isHumanPolishAdminEmail(email)) {
    return {
      ok: false,
      status: 403,
      error: "You do not have access to Human Polish operations.",
      code: "forbidden",
    }
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Human Polish is not configured.",
      code: "not_configured",
    }
  }

  return {
    ok: true,
    user,
    email: normalizeAdminEmail(email!),
    supabase,
  }
}
