import { logCreditError, type CreditErrorRow } from "@/lib/usage/creditErrors"

export type RenderEventWrite = "inserted" | "duplicate" | "failed"

export type SettledRender = {
  imageUrl: string
  usage: {
    nearLimit: boolean
    creditsRemaining: number | null
  }
}

function fallbackRemaining(before: number | null, amount: number): number | null {
  if (before == null) return null
  return Math.max(0, before - amount)
}

/**
 * Bookkeeping after a successful image. Failures are logged and the image is still returned.
 * A duplicate render id is not charged again. A failed event insert still charges this request
 * so the render is not free; the unique (user_id, render_id) key stops a later retry from charging twice
 * once the event row can be stored.
 */
export async function settleRenderCharge(input: {
  imageUrl: string
  userId: string
  planId: string | null
  renderId: string
  amount: number
  creditsRemaining: number | null
  nearLimit: boolean
  recordEvent: () => Promise<RenderEventWrite>
  consume: () => Promise<void>
  logError?: (row: CreditErrorRow) => Promise<void>
}): Promise<SettledRender> {
  const log = input.logError ?? logCreditError
  const base = {
    imageUrl: input.imageUrl,
    usage: { nearLimit: input.nearLimit, creditsRemaining: input.creditsRemaining },
  }

  let event: RenderEventWrite = "failed"
  try {
    event = await input.recordEvent()
  } catch (error) {
    const message = error instanceof Error ? error.message : "render event failed"
    console.error("[credits] render_event_failed", input.userId, input.planId, input.renderId, input.amount, message)
    await log({
      user_id: input.userId,
      plan_id: input.planId,
      render_id: input.renderId,
      amount: input.amount,
      stage: "render_event",
      message,
    })
    event = "failed"
  }

  if (event === "duplicate") return base

  try {
    await input.consume()
    return {
      imageUrl: input.imageUrl,
      usage: {
        nearLimit: input.nearLimit,
        creditsRemaining: fallbackRemaining(input.creditsRemaining, input.amount),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "credit consumption failed"
    console.error("[credits] consume_failed", input.userId, input.planId, input.renderId, input.amount, message)
    await log({
      user_id: input.userId,
      plan_id: input.planId,
      render_id: input.renderId,
      amount: input.amount,
      stage: "consume",
      message,
    })
    return {
      imageUrl: input.imageUrl,
      usage: {
        nearLimit: input.nearLimit,
        creditsRemaining: fallbackRemaining(input.creditsRemaining, input.amount),
      },
    }
  }
}
