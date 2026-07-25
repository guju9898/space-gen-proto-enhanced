/**
 * Shared service-role Supabase client for Human Polish server routes.
 * Never import this module from browser/client code.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export function getHumanPolishSupabaseService(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
