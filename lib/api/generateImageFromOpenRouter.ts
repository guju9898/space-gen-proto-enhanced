/**
 * GEMINI IMAGE EXTRACTION PATCH
 * 
 * This file handles image generation via OpenRouter for Exterior and Landscape studios.
 * It uses Gemini 2.5 Flash Image (Nano Banana) model.
 * 
 * HOW GEMINI IMAGES ARE DETECTED:
 * - Model detection: Checks if model string contains "gemini" (from request body.model or response result.model)
 * - Runs Gemini-specific extraction first when detected
 * 
 * WHERE EXTRACTION OCCURS:
 * - Lines 131-176: Gemini-specific multimodal content parsing
 *   - Checks message.content[] array for image parts
 *   - Handles type "image_url", type "image", and base64 text patterns
 *   - Normalizes base64 strings to data:image/png;base64, format
 * - Lines 178-201: Standard OpenRouter extraction (fallback)
 *   - Checks message.images[], tool_calls[], attachments[], content[]
 * 
 * WHY REPLICATE IS UNAFFECTED:
 * - Interior Studio uses generateImageFromConfig() → generateImageFromModelsLab()
 * - This file (generateImageFromOpenRouter) is ONLY called by Exterior/Landscape
 * - No changes to Replicate/ModelsLab code paths
 * 
 * The extraction preserves existing Supabase upload logic (lines 239-255)
 * and maintains backward compatibility with other OpenRouter providers.
 */

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  // Accept HTTP/HTTPS URLs
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  // Accept base64 data URLs
  if (url.startsWith("data:image/")) {
    return true
  }
  return false
}

export async function generateImageFromOpenRouter(config: {
  prompt: string
  image?: string | null
  renderType: "exterior" | "landscape"
}): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    console.error("❌ OpenRouter API Key Missing: OPENROUTER_API_KEY is not defined")
    return null
  }

  if (!config.prompt?.trim()) {
    console.error("❌ Empty prompt provided to generateImageFromOpenRouter")
    return null
  }

  try {
    const body: {
      model: string
      messages: Array<{
        role: string
        content: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >
      }>
      modalities: string[]
      stream: boolean
    } = {
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
            content: [
            { type: "text", text: config.prompt },
            ...(config.image && isValidImageUrl(config.image)
              ? [{ type: "image_url", image_url: { url: config.image } } as const]
              : [])
          ]
        }
      ],
      modalities: ["image", "text"],
      stream: false
    }

    console.log("📝 OpenRouter Request:", {
      model: body.model,
      hasImage: !!config.image,
      promptLength: config.prompt.length,
      modalities: body.modalities,
      stream: body.stream
    })

    const apiUrl = "https://openrouter.ai/api/v1/chat/completions"
    console.log("🌐 Calling OpenRouter API...")

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://renderspace.ai",
        "X-Title": "Renderspace AI"
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("❌ OpenRouter API error:", res.status, errorText)
      return null
    }

    const result = await res.json()
    console.log("📥 OpenRouter API response:", result)

    const choice = result.choices?.[0]
    if (!choice) {
      console.error("❌ No choices returned from OpenRouter", {
        status: res.status,
        response: result
      })
      return null
    }

    const message = choice.message
    if (!message) {
      console.error("❌ No message in choice", {
        choice: choice,
        fullResponse: result
      })
      return null
    }

    // Detect Gemini model from request or response metadata
    const isGeminiModel = body.model.includes("gemini") || result.model?.includes("gemini")
    
    /**
     * GEMINI IMAGE EXTRACTION
     * 
     * Gemini 2.5 Flash Image returns images in multimodal content arrays.
     * Images can appear as:
     * - Base64 strings in content parts with type "image" or "image_url"
     * - Inline base64 data (with or without data:image/ prefix)
     * - Structured multimodal message parts
     * 
     * This extraction layer handles Gemini-specific patterns while preserving
     * existing OpenRouter extraction logic for other providers.
     */
    let imageUrl: string | null = null

    // GEMINI-SPECIFIC EXTRACTION (runs first if Gemini detected)
    if (isGeminiModel && Array.isArray(message.content)) {
      // Check for image parts in multimodal content array
      for (const part of message.content) {
        // Pattern 1: Direct image_url object
        if (part.type === "image_url" && part.image_url?.url) {
          imageUrl = part.image_url.url
          console.log("✅ [Gemini] Image found in content[].image_url.url")
          break
        }
        // Pattern 2: Image type with inline base64
        if (part.type === "image" && part.image) {
          // Handle both string base64 and object with data property
          if (typeof part.image === "string") {
            imageUrl = part.image.startsWith("data:image") 
              ? part.image 
              : `data:image/png;base64,${part.image}`
            console.log("✅ [Gemini] Image found in content[].image (string)")
            break
          }
          if (part.image.data) {
            imageUrl = part.image.data.startsWith("data:image")
              ? part.image.data
              : `data:image/png;base64,${part.image.data}`
            console.log("✅ [Gemini] Image found in content[].image.data")
            break
          }
          if (part.image.url) {
            imageUrl = part.image.url
            console.log("✅ [Gemini] Image found in content[].image.url")
            break
          }
        }
        // Pattern 3: Text part that might contain base64 (fallback)
        if (part.type === "text" && typeof part.text === "string") {
          // Check if text is actually base64 image data
          const text = part.text.trim()
          if (text.length > 100 && /^[A-Za-z0-9+/=]+$/.test(text.replace(/\s/g, ""))) {
            // Likely base64, try to use it
            imageUrl = text.startsWith("data:image") ? text : `data:image/png;base64,${text}`
            console.log("✅ [Gemini] Image found in content[].text (base64)")
            break
          }
        }
      }
    }

    // STANDARD OPENROUTER EXTRACTION (fallback for non-Gemini or if Gemini extraction failed)
    if (!imageUrl) {
      if (message.images?.length && message.images[0]?.image_url?.url) {
        imageUrl = message.images[0].image_url.url
        console.log("✅ Image found in message.images[0].image_url.url")
      }
      else if (message.tool_calls?.[0]?.image?.data) {
        imageUrl = message.tool_calls[0].image.data
        console.log("✅ Image found in tool_calls[0].image.data")
      }
      else if (message.attachments?.[0]?.data) {
        imageUrl = message.attachments[0].data
        console.log("✅ Image found in attachments[0].data")
      }
      else if (Array.isArray(message.content)) {
        const imageContent = message.content.find(
          (item: any) => item.type === "image_url" && item.image_url?.url
        )
        if (imageContent?.image_url?.url) {
          imageUrl = imageContent.image_url.url
          console.log("✅ Image found in content[].image_url.url")
        }
      }
    }

    if (!imageUrl) {
      // Enhanced error logging for Gemini vs other providers
      const errorContext: any = {
        isGemini: isGeminiModel,
        model: body.model,
        messageKeys: Object.keys(message),
        hasImages: !!message.images,
        imagesLength: message.images?.length,
        hasToolCalls: !!message.tool_calls,
        hasAttachments: !!message.attachments,
        hasContent: Array.isArray(message.content),
        contentLength: Array.isArray(message.content) ? message.content.length : 0,
        contentTypes: Array.isArray(message.content) 
          ? message.content.map((p: any) => p?.type).filter(Boolean)
          : []
      }
      
      if (isGeminiModel) {
        console.error("❌ [Gemini] No image found in multimodal content", {
          ...errorContext,
          contentPreview: Array.isArray(message.content) 
            ? message.content.map((p: any) => ({
                type: p?.type,
                hasImage: !!p?.image,
                hasImageUrl: !!p?.image_url,
                textLength: typeof p?.text === "string" ? p.text.length : 0
              }))
            : []
        })
      } else {
        console.error("❌ No image found in OpenRouter response", errorContext)
      }
      
      return null
    }

    // Upload base64 image to Supabase Storage
    if (imageUrl.startsWith("data:image")) {
      console.log("📤 Uploading base64 image to Supabase Storage...")
      const { uploadBase64ToSupabase } = await import("./uploadBase64ToSupabase")
      const uploadedUrl = await uploadBase64ToSupabase({
        base64DataUrl: imageUrl,
        filePath: `renders/${config.renderType}/${Date.now()}.png`
      })

      if (!uploadedUrl) {
        console.error("❌ Failed to upload image to Supabase")
        return null
      }

      console.log("✅ Image generated and uploaded to Supabase:", uploadedUrl)
      return uploadedUrl
    }

    // If it's already a direct URL, return it
    if (isValidImageUrl(imageUrl)) {
      console.log("✅ Received direct image URL from OpenRouter:", imageUrl)
      return imageUrl
    }

    console.error("❌ Unexpected image URL format", {
      imageUrl: imageUrl.substring(0, 100),
      imageUrlLength: imageUrl.length
    })
    return null
  } catch (error) {
    console.error("❌ OpenRouter generation error:", error)
    return null
  }
}

