import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type CreditErrorStage = "consume" | "render_event" | "webhook_grant"

export type CreditErrorRow = {
  user_id?: string | null
  plan_id?: string | null
  render_id?: string | null
  amount?: number | null
  stage: CreditErrorStage
  message: string
}

type ErrorWriter = {
  from: (table: string) => {
    insert: (row: CreditErrorRow) => Promise<{ error: { message?: string } | null }>
  }
}

function serviceDb(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceRoleKey) return null
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Service-role insert. A logging failure is printed and never thrown. */
export async function logCreditError(row: CreditErrorRow, db?: ErrorWriter | null): Promise<void> {
  const client = db === undefined ? serviceDb() : db
  if (!client) {
    console.error("[credits] credit_errors skipped: Supabase is not configured", row.stage, row.message)
    return
  }
  const { error } = await client.from("credit_errors").insert({
    user_id: row.user_id ?? null,
    plan_id: row.plan_id ?? null,
    render_id: row.render_id ?? null,
    amount: row.amount ?? null,
    stage: row.stage,
    message: row.message.slice(0, 500),
  })
  if (error) console.error("[credits] credit_errors insert failed", error.message ?? "unknown error")
}
