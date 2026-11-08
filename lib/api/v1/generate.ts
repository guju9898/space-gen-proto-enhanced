import Replicate from "replicate"
import { generateImageFromOpenRouter } from "@/lib/api/generateImageFromOpenRouter"
import { uploadBase64ToSupabase } from "@/lib/api/uploadBase64ToSupabase"
import type { SpaceType } from "@/lib/api/v1/prompt"

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

async function persistResult(image: string, spaceType: SpaceType, renderId: string): Promise<{
  imageUrl: string
  storagePath: string
}> {
  const storagePath = `api/${spaceType}/${renderId}.png`
  if (image.startsWith("data:image/")) {
    const uploaded = await uploadBase64ToSupabase({
      base64DataUrl: image,
      filePath: storagePath,
    })
    if (!uploaded) throw new Error("Failed to store generated image")
    return { imageUrl: uploaded, storagePath }
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    const res = await fetch(image)
    if (!res.ok) throw new Error("Failed to fetch generated image")
    const buffer = Buffer.from(await res.arrayBuffer())
    const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`
    const uploaded = await uploadBase64ToSupabase({
      base64DataUrl: dataUrl,
      filePath: storagePath,
    })
    if (!uploaded) throw new Error("Failed to store generated image")
    return { imageUrl: uploaded, storagePath }
  }

  throw new Error("Unsupported generated image format")
}

export async function runPublicApiGeneration(input: {
  spaceType: SpaceType
  prompt: string
  imageUrl: string
  renderId: string
  realism?: number
}): Promise<{ imageUrl: string; storagePath: string }> {
  if (input.spaceType === "interior") {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) throw new Error("Interior generation is not configured")
    const replicate = new Replicate({ auth: token })
    const imageResponse = await fetch(input.imageUrl)
    if (!imageResponse.ok) throw new Error("Failed to fetch reference image")
    const imageBuffer = await imageResponse.arrayBuffer()
    const guidance_scale = typeof input.realism === "number" ? input.realism / 10 : 7
    const result = await replicate.run(
      "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      {
        input: {
          image: Buffer.from(imageBuffer),
          prompt: input.prompt.trim(),
          guidance_scale,
          num_inference_steps: 30,
        },
      }
    )

    let generated: string
    if (result instanceof ReadableStream) {
      generated = await streamToBase64(result)
    } else if (Array.isArray(result) && typeof result[0] === "string") {
      generated = result[0]
    } else if (
      typeof result === "object" &&
      result !== null &&
      "output" in result &&
      (result as { output: unknown }).output instanceof ReadableStream
    ) {
      generated = await streamToBase64((result as { output: ReadableStream }).output)
    } else if (typeof result === "string") {
      generated = result
    } else {
      throw new Error("Unexpected Replicate output format")
    }
    return persistResult(generated, input.spaceType, input.renderId)
  }

  const imageUrl = await generateImageFromOpenRouter({
    prompt: input.prompt,
    image: input.imageUrl,
    renderType: input.spaceType,
    filePath: `api/${input.spaceType}/${input.renderId}.png`,
  })
  if (!imageUrl?.trim()) throw new Error("Generation returned no image")

  // OpenRouter helper may already upload; still normalize to api/ path when base64
  if (imageUrl.startsWith("data:image/")) {
    return persistResult(imageUrl, input.spaceType, input.renderId)
  }
  return {
    imageUrl,
    storagePath: `api/${input.spaceType}/${input.renderId}.png`,
  }
}
