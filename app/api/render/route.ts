import { NextResponse } from "next/server"
import Replicate from "replicate"
import type { RenderRequest } from "@/types/studio"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isObject } from "@/lib/types/typeGuards"

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
    // Initialize Supabase server client (reads auth from cookies)
    const supabase = await createSupabaseServerClient()

    const body = await request.json() as unknown

    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { renderType, config, sourceImage } = body as RenderRequest

    // Authenticate user from cookies
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

    // Check credits
    const { data: userData } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (!userData || userData.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      )
    }

    // Generate prompt
    const prompt = generatePrompt(renderType, config)

    // Run Replicate
    const output = (await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt,
          image: sourceImage,
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5,
        },
      }
    )) as string[]

    const imageUrl = output[0]

    // Deduct credit
    await supabase
      .from("users")
      .update({ credits: userData.credits - 1 })
      .eq("id", user.id)

    // Save render
    await supabase.from("renders").insert({
      user_id: user.id,
      render_type: renderType,
      config,
      source_image_url: sourceImage,
      result_image_url: imageUrl,
      prompt,
    })

    return NextResponse.json({
      imageUrl,
      prompt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Render error:", error)
    return NextResponse.json(
      { error: "Failed to process render request" },
      { status: 500 }
    )
  }
}

function generatePrompt(renderType: string, config: any): string {
  const basePrompt = `A ${config.style} ${renderType} design with ${config.colorPalette} color palette`

  switch (renderType) {
    case "interior":
      return `${basePrompt}, ${config.roomType} with ${config.furnitureStyle} furniture`
    case "exterior":
      return `${basePrompt}, ${config.buildingType} in ${config.architecturalStyle} style`
    case "product":
      return `${basePrompt}, ${config.productType} made of ${config.material}`
    default:
      return basePrompt
  }
}
