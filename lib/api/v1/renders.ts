import { randomUUID } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { runPublicApiGeneration } from "@/lib/api/v1/generate"
import { buildPublicApiPrompt, type RenderOptions, type SpaceType } from "@/lib/api/v1/prompt"
import { RENDER_CREDIT_COST } from "@/lib/usage/creditCost"
import { consumeCredit } from "@/lib/usage/enforceCredits"
import { settleRenderCharge } from "@/lib/usage/settleRenderCharge"
import { recordRenderEvent } from "@/lib/usage/enforceCredits"

export type ApiRenderRow = {
  id: string
  user_id: string
  api_key_id: string | null
  space_type: SpaceType
  status: "queued" | "running" | "completed" | "failed"
  prompt: string | null
  instruction: string | null
  options: RenderOptions
  source_image_url: string | null
  result_image_url: string | null
  result_storage_path: string | null
  error_message: string | null
  credits_charged: number | null
  idempotency_key: string | null
  created_at: string
  completed_at: string | null
}

export function toPublicRender(row: ApiRenderRow) {
  return {
    id: row.id,
    status: row.status,
    space_type: row.space_type,
    image_url: row.result_image_url,
    source_image_url: row.source_image_url,
    instruction: row.instruction,
    options: row.options,
    credits: {
      charged: row.credits_charged,
    },
    error: row.error_message,
    created_at: row.created_at,
    completed_at: row.completed_at,
  }
}

export async function findIdempotentRender(
  db: SupabaseClient,
  userId: string,
  idempotencyKey: string
): Promise<ApiRenderRow | null> {
  const { data } = await db
    .from("api_renders")
    .select("*")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle()
  return (data as ApiRenderRow | null) ?? null
}

export async function getRenderForUser(
  db: SupabaseClient,
  userId: string,
  renderId: string
): Promise<ApiRenderRow | null> {
  const { data } = await db
    .from("api_renders")
    .select("*")
    .eq("user_id", userId)
    .eq("id", renderId)
    .maybeSingle()
  return (data as ApiRenderRow | null) ?? null
}

export async function listRendersForUser(
  db: SupabaseClient,
  userId: string,
  limit = 20
): Promise<ApiRenderRow[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const { data } = await db
    .from("api_renders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(safeLimit)
  return (data || []) as ApiRenderRow[]
}

export async function createAndRunRender(input: {
  db: SupabaseClient
  userId: string
  apiKeyId: string
  spaceType: SpaceType
  imageUrl: string
  instruction?: string | null
  options?: RenderOptions
  promptOverride?: string | null
  realism?: number
  idempotencyKey?: string | null
  planId: string
  creditsRemaining: number | null
  periodStart: string
}): Promise<ApiRenderRow> {
  if (input.idempotencyKey) {
    const existing = await findIdempotentRender(input.db, input.userId, input.idempotencyKey)
    if (existing) return existing
  }

  const id = randomUUID()
  const { prompt, options } = await buildPublicApiPrompt({
    spaceType: input.spaceType,
    instruction: input.instruction,
    options: input.options,
    promptOverride: input.promptOverride,
  })

  const { data: inserted, error: insertError } = await input.db
    .from("api_renders")
    .insert({
      id,
      user_id: input.userId,
      api_key_id: input.apiKeyId,
      space_type: input.spaceType,
      status: "running",
      prompt,
      instruction: input.instruction ?? null,
      options,
      source_image_url: input.imageUrl,
      idempotency_key: input.idempotencyKey ?? null,
    })
    .select("*")
    .single()

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Could not create render record")
  }

  try {
    const result = await runPublicApiGeneration({
      spaceType: input.spaceType,
      prompt,
      imageUrl: input.imageUrl,
      renderId: id,
      realism: input.realism,
    })

    await settleRenderCharge({
      imageUrl: result.imageUrl,
      userId: input.userId,
      planId: input.planId,
      renderId: id,
      amount: RENDER_CREDIT_COST,
      creditsRemaining: input.creditsRemaining,
      nearLimit: false,
      recordEvent: () =>
        recordRenderEvent(input.userId, input.periodStart, id, RENDER_CREDIT_COST),
      consume: () => consumeCredit(input.userId, input.periodStart, RENDER_CREDIT_COST),
    })

    const { data: completed, error: updateError } = await input.db
      .from("api_renders")
      .update({
        status: "completed",
        result_image_url: result.imageUrl,
        result_storage_path: result.storagePath,
        credits_charged: RENDER_CREDIT_COST,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single()

    if (updateError || !completed) {
      throw new Error(updateError?.message || "Could not finalize render")
    }
    return completed as ApiRenderRow
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed"
    const { data: failed } = await input.db
      .from("api_renders")
      .update({
        status: "failed",
        error_message: message.slice(0, 500),
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single()
    if (failed) return failed as ApiRenderRow
    throw error
  }
}
