import { NextResponse } from "next/server"
import Replicate from "replicate"
import { isString, isObject } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

// Replicate can be instantiated at module level (safe)
const replicateApiToken = process.env.REPLICATE_API_TOKEN
if (!replicateApiToken) {
  throw new Error("Missing REPLICATE_API_TOKEN")
}

const replicate = new Replicate({
  auth: replicateApiToken,
})

export async function POST(request: Request) {
  try {
    const body = await request.json() as unknown

    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { prompt, image, realism } = body as {
      prompt?: unknown
      image?: unknown
      realism?: unknown
    }

    if (!isString(prompt)) {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 }
      )
    }

    // Prepare input for adirik/interior-design model
    const input: {
      prompt: string
      image?: string
      num_outputs?: number
      guidance_scale?: number
      num_inference_steps?: number
    } = {
      prompt: prompt.trim(),
      num_outputs: 1,
      guidance_scale: 7.5,
      num_inference_steps: 50,
    }

    // Add image if provided (must be a valid URL or base64 data URL)
    if (isString(image)) {
      if (image.startsWith("data:image/") || image.startsWith("http://") || image.startsWith("https://")) {
        input.image = image
      } else {
        console.warn("⚠️ Invalid image format, ignoring image parameter")
      }
    }

    console.log("📤 Calling Replicate adirik/interior-design with:", {
      promptLength: input.prompt.length,
      hasImage: !!input.image,
      realism: realism || "default"
    })

    // Run Replicate adirik/interior-design model
    const output = (await replicate.run(
      "adirik/interior-design",
      {
        input,
      }
    )) as string | string[]

    // Handle output (can be string or array)
    const imageUrl = Array.isArray(output) ? output[0] : output

    if (!imageUrl) {
      console.error("❌ No image URL returned from Replicate")
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      )
    }

    console.log("✅ Image generated successfully:", imageUrl)

    return NextResponse.json({
      imageUrl,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Replicate generation error:", error)
    return NextResponse.json(
      { error: "Failed to process image generation request" },
      { status: 500 }
    )
  }
}

