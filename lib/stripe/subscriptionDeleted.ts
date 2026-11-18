/**
 * Handles Stripe `customer.subscription.deleted` for one profile.
 *
 * - Marks the profile canceled but KEEPS `current_plan` (the column is NOT NULL;
 *   writing null made Postgres reject the whole update, so cancels were never saved).
 *   Access checks gate on `subscription_status`, so a canceled profile cannot render.
 * - Upserts the `subscriptions` row so a customer whose checkout row was never
 *   written still ends up with a canceled record.
 * - Ignores the event when the profile already points at a different, newer
 *   subscription (e.g. an old one deleted after the customer re-subscribed).
 * - Reports failure so the webhook can return 500 and Stripe retries.
 */

export type SubscriptionDeletedDb = {
  from(table: string): any
}

export type SubscriptionDeletedInput = {
  profileId: string
  /** profiles.stripe_subscription_id, if any. */
  profileSubscriptionId: string | null
  subscriptionId: string | null
  customerId: string
  planCode: string | null
  periodStartIso: string | null
  periodEndIso: string | null
  nowIso?: string
}

export type SubscriptionDeletedResult =
  | { ok: true; skipped?: "not_current_subscription" }
  | { ok: false; error: string }

export async function applySubscriptionDeleted(
  db: SubscriptionDeletedDb,
  input: SubscriptionDeletedInput
): Promise<SubscriptionDeletedResult> {
  const now = input.nowIso ?? new Date().toISOString()

  if (
    input.profileSubscriptionId &&
    input.subscriptionId &&
    input.profileSubscriptionId !== input.subscriptionId
  ) {
    return { ok: true, skipped: "not_current_subscription" }
  }

  const subscriptionRow: Record<string, unknown> = {
    user_id: input.profileId,
    stripe_customer_id: input.customerId,
    status: "canceled",
    cancel_at_period_end: false,
    updated_at: now,
  }
  if (input.subscriptionId) subscriptionRow.stripe_subscription_id = input.subscriptionId
  if (input.planCode) subscriptionRow.plan_code = input.planCode
  if (input.periodStartIso) subscriptionRow.current_period_start = input.periodStartIso
  if (input.periodEndIso) subscriptionRow.current_period_end = input.periodEndIso

  const { error: subscriptionError } = await db
    .from("subscriptions")
    .upsert(subscriptionRow, { onConflict: "user_id" })

  const { error: profileError } = await db
    .from("profiles")
    .update({ subscription_status: "canceled" })
    .eq("id", input.profileId)

  if (profileError) {
    return { ok: false, error: `profile update failed: ${profileError.message ?? "unknown error"}` }
  }
  if (subscriptionError) {
    return { ok: false, error: `subscriptions upsert failed: ${subscriptionError.message ?? "unknown error"}` }
  }
  return { ok: true }
}
