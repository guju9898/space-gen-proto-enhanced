import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { generateImageFromOpenRouter } from "@/lib/api/generateImageFromOpenRouter"
import { enforceCredits, consumeCredit, consumeDemoCredit, consumeIntroCredit, recordRenderEvent } from "@/lib/usage/enforceCredits"
import { isString, isObject } from "@/lib/types/typeGuards"
import {
  getDemoSupabase,
  getClientIp,
  getCookieId,
  isValidDemoEmail,
  checkDemoLimit,
  incrementDemoUsage,
  DEMO_LIMIT,
} from "@/lib/demo/usage"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const bodyTyped = body as {
      prompt?: unknown
      image?: unknown
      renderType?: unknown
      renderId?: unknown
      demo?: unknown
      demoEmail?: unknown
    }

    // Demo mode: no auth, enforce demo_usage limit
    if (bodyTyped.demo === true && isString(bodyTyped.demoEmail)) {
      const email = bodyTyped.demoEmail.trim().toLowerCase()
      if (!isValidDemoEmail(bodyTyped.demoEmail)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 }
        )
      }
      const supabaseDemo = getDemoSupabase()
      if (!supabaseDemo) {
        return NextResponse.json(
          { error: "Demo mode is not configured" },
          { status: 503 }
        )
      }
      const ip = getClientIp(request)
      const cookieId = getCookieId(request)
      const { allowed } = await checkDemoLimit(supabaseDemo, email, ip, cookieId)
      if (!allowed) {
        return NextResponse.json(
          { error: "Demo limit reached" },
          { status: 429 }
        )
      }
      if (!isString(bodyTyped.prompt) || !isString(bodyTyped.renderType)) {
        return NextResponse.json(
          { error: "Missing required fields: prompt and renderType" },
          { status: 400 }
        )
      }
      if (bodyTyped.renderType !== "exterior" && bodyTyped.renderType !== "landscape") {
        return NextResponse.json(
          { error: "Invalid renderType. Must be 'exterior' or 'landscape'" },
          { status: 400 }
        )
      }
      const imageUrl = await generateImageFromOpenRouter({
        prompt: bodyTyped.prompt,
        image: isString(bodyTyped.image) ? bodyTyped.image : null,
        renderType: bodyTyped.renderType,
      })
      if (!imageUrl?.trim()) {
        return NextResponse.json(
          { error: "Failed to generate image" },
          { status: 500 }
        )
      }
      const newRendersUsed = await incrementDemoUsage(supabaseDemo, email, ip, cookieId)
      const rendersRemaining = Math.max(0, DEMO_LIMIT - newRendersUsed)
      return NextResponse.json({
        imageUrl,
        timestamp: new Date().toISOString(),
        rendersRemaining,
        rendersUsed: newRendersUsed,
      })
    }

    // Authenticated flow
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const creditCheck = await enforceCredits(user.id)
    if (!creditCheck.allow) {
      const errorMessage = creditCheck.reason || "capacity_reached"
      return NextResponse.json(
        { error: errorMessage },
        { status: 402 }
      )
    }

    const { prompt, image, renderType, renderId } = bodyTyped

    // Validate renderId for idempotency
    if (!isString(renderId)) {
      return NextResponse.json(
        { error: "renderId is required" },
        { status: 400 }
      )
    }

    // Calculate credit cost: base 1.0 + 0.5 if reference image is present
    const hasReferenceImage = isString(image) && image.trim() !== ""
    const creditCost = hasReferenceImage ? 1.5 : 1.0

    if (!isString(prompt) || !isString(renderType)) {
      return NextResponse.json(
        { error: "Missing required fields: prompt and renderType" },
        { status: 400 }
      )
    }

    if (renderType !== "exterior" && renderType !== "landscape") {
      return NextResponse.json(
        { error: "Invalid renderType. Must be 'exterior' or 'landscape'" },
        { status: 400 }
      )
    }

    const imageUrl = await generateImageFromOpenRouter({
      prompt,
      image: isString(image) ? image : null,
      renderType,
    })

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      )
    }

    // Validate imageUrl is non-empty before consuming credits
    if (!imageUrl || imageUrl.trim() === "") {
      console.error("❌ Generated image URL is empty, not consuming credits")
      return NextResponse.json(
        { error: "Generated image URL is invalid" },
        { status: 500 }
      )
    }

    // Record render event for idempotency (only consumes if first time)
    const isFirstTime = await recordRenderEvent(
      user.id,
      creditCheck.periodStart,
      renderId,
      creditCost
    )

    let finalCreditsRemaining = creditCheck.creditsRemaining

    if (isFirstTime) {
      // Only consume credits if this is the first time we've seen this render_id
      if (creditCheck.planId === "demo") {
        await consumeDemoCredit(user.id, creditCost)
      } else if (creditCheck.planId === "intro") {
        await consumeIntroCredit(user.id, creditCost)
      } else {
        await consumeCredit(user.id, creditCheck.periodStart, creditCost)
      }

      // Recalculate credits remaining after consumption
      if (creditCheck.creditsRemaining !== null && creditCheck.planId !== "business") {
        finalCreditsRemaining = Math.max(0, (creditCheck.creditsRemaining || 0) - creditCost)
      }
    } else {
      console.log(`⚠️ Render ${renderId} already processed - skipping credit consumption`)
    }

    return NextResponse.json({
      imageUrl,
      timestamp: new Date().toISOString(),
      usage: {
        nearLimit: creditCheck.nearLimit,
        creditsRemaining: finalCreditsRemaining,
      },
    })
  } catch (error) {
    console.error("OpenRouter generation error:", error)
    return NextResponse.json(
      { error: "Failed to process image generation request" },
      { status: 500 }
    )
  }
}

