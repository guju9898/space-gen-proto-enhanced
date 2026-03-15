import { NextResponse } from "next/server"
import Replicate from "replicate"
import { createSupabaseServerClient } from "@/lib/supabase/server"
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

function getReplicateClient(): Replicate | null {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return null
  return new Replicate({ auth: token })
}

// Helper function to convert ReadableStream to base64 data URL
async function streamToBase64(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }

  const buffer = Buffer.concat(chunks)
  return `data:image/png;base64,${buffer.toString("base64")}`
}

export async function POST(req: Request) {
  try {
    const replicate = getReplicateClient()
    if (!replicate) {
      return NextResponse.json(
        { error: "Image generation is not configured (missing REPLICATE_API_TOKEN)" },
        { status: 503 }
      )
    }

    const body = (await req.json()) as unknown
    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const bodyTyped = body as {
      prompt?: unknown
      imageUrl?: unknown
      realism?: unknown
      renderId?: unknown
      demo?: unknown
      demoEmail?: unknown
    }

    // Demo mode: no auth, enforce demo_usage limit by email/IP/cookie
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
      const ip = getClientIp(req)
      const cookieId = getCookieId(req)
      const { allowed } = await checkDemoLimit(supabaseDemo, email, ip, cookieId)
      if (!allowed) {
        return NextResponse.json(
          { error: "Demo limit reached" },
          { status: 429 }
        )
      }
      if (!isString(bodyTyped.prompt) || bodyTyped.prompt.trim().length === 0) {
        return NextResponse.json(
          { error: "prompt is required" },
          { status: 400 }
        )
      }
      if (!isString(bodyTyped.imageUrl) || !bodyTyped.imageUrl.startsWith("http")) {
        return NextResponse.json(
          { error: "imageUrl is required" },
          { status: 400 }
        )
      }
      const guidance_scale = typeof bodyTyped.realism === "number" ? bodyTyped.realism / 10 : 7
      const imageResponse = await fetch(bodyTyped.imageUrl)
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch reference image")
      }
      const imageBuffer = await imageResponse.arrayBuffer()
      const result = await replicate.run(
        "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        {
          input: {
            image: Buffer.from(imageBuffer),
            prompt: bodyTyped.prompt.trim(),
            guidance_scale,
            num_inference_steps: 30,
          },
        }
      )
      let generatedImageUrl: string
      if (result instanceof ReadableStream) {
        generatedImageUrl = await streamToBase64(result)
      } else if (Array.isArray(result) && typeof result[0] === "string") {
        generatedImageUrl = result[0]
      } else if (
        typeof result === "object" &&
        result !== null &&
        "output" in result &&
        (result as { output: unknown }).output instanceof ReadableStream
      ) {
        generatedImageUrl = await streamToBase64((result as { output: ReadableStream }).output)
      } else {
        console.error("Unexpected Replicate output:", result)
        throw new Error("Unexpected Replicate output format")
      }
      if (!generatedImageUrl?.trim()) {
        return NextResponse.json(
          { error: "Generated image URL is invalid" },
          { status: 500 }
        )
      }
      const newRendersUsed = await incrementDemoUsage(supabaseDemo, email, ip, cookieId)
      const rendersRemaining = Math.max(0, DEMO_LIMIT - newRendersUsed)
      return NextResponse.json({
        imageUrl: generatedImageUrl,
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

    const { prompt, imageUrl, realism, renderId } = bodyTyped as {
      prompt?: unknown
      imageUrl?: unknown
      realism?: unknown
      renderId?: unknown
    }

    // Validate prompt
    if (!isString(prompt) || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      )
    }

    // Validate imageUrl - must be a valid HTTP/HTTPS URL (Replicate fetches by URL)
    if (!isString(imageUrl) || !imageUrl.startsWith("http")) {
      console.log("Interior generation blocked: no valid imageUrl provided")
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      )
    }

    // Validate renderId for idempotency
    if (!isString(renderId)) {
      return NextResponse.json(
        { error: "renderId is required" },
        { status: 400 }
      )
    }

    // Interior always costs 1.0 credit (reference image is required but doesn't add cost)
    const creditCost = 1.0

    // Calculate guidance_scale from realism (0-100 -> 0-10, default 7)
    const guidance_scale = typeof realism === "number" ? realism / 10 : 7
    const num_inference_steps = 30

    console.log("📤 Calling Replicate adirik/interior-design with:", {
      promptLength: prompt.trim().length,
      imageUrl: imageUrl.substring(0, 50) + "...",
      imageUrlStartsWithHttps: imageUrl.startsWith("https"),
      guidance_scale,
      num_inference_steps
    })

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch reference image")
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    // Run Replicate adirik/interior-design model
    // Note: Replicate requires version-pinned model IDs to avoid 404 errors
    // Pass image as Buffer; Replicate cannot reliably fetch Supabase URLs directly
    const result = await replicate.run(
      "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      {
        input: {
          image: Buffer.from(imageBuffer),
          prompt: prompt.trim(),
          guidance_scale,
          num_inference_steps,
        },
      }
    )

    // Normalize Replicate output - handle ReadableStream, arrays, or strings
    let generatedImageUrl: string

    if (result instanceof ReadableStream) {
      generatedImageUrl = await streamToBase64(result)
    } else if (Array.isArray(result) && typeof result[0] === "string") {
      generatedImageUrl = result[0]
    } else if (
      typeof result === "object" &&
      result !== null &&
      "output" in result &&
      result.output instanceof ReadableStream
    ) {
      generatedImageUrl = await streamToBase64(result.output)
    } else {
      console.error("Unexpected Replicate output:", result)
      throw new Error("Unexpected Replicate output format")
    }

    console.log("✅ Image generated successfully")

    // Validate imageUrl is non-empty before consuming credits
    if (!generatedImageUrl || generatedImageUrl.trim() === "") {
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
      imageUrl: generatedImageUrl,
      usage: {
        nearLimit: creditCheck.nearLimit,
        creditsRemaining: finalCreditsRemaining,
      },
    })
  } catch (err: any) {
    console.error("❌ Replicate Interior Error:", err)
    return NextResponse.json(
      { error: "Interior image generation failed", details: err?.message },
      { status: 500 }
    )
  }
}

