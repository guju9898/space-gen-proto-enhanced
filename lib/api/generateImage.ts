interface GenerateImageOptions {
  prompt: string;
  initImage?: string | null;
  realism?: number;
  width?: number;
  height?: number;
  strength?: number;
}

// Validate API key format
function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false;
  return key.trim().length > 0;
}

// Validate image URL format
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

// Upload image to ImgBB
async function uploadToImgBB(file: File): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ImgBB API Key Missing: NEXT_PUBLIC_IMGBB_API_KEY is not defined');
    return null;
  }

  try {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Upload to ImgBB
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: new URLSearchParams({ image: base64 }),
    });

    const data = await response.json();
    
    if (!data?.data?.url) {
      console.error('❌ ImgBB Upload Failed:', data);
      return null;
    }

    console.log('✅ Image uploaded to ImgBB:', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('❌ ImgBB Upload Error:', error);
    return null;
  }
}

export function buildPrompt(config: Record<string, any>): string {
  // Map config keys to their corresponding prompt prefixes
  const promptPrefixes: Record<string, string> = {
    // Interior specific
    roomType: "a",
    designStyle: "in",
    // Exterior specific
    buildingType: "a",
    architecturalStyle: "in",
    surroundingEnvironment: "in a",
    // Landscape specific
    gardenType: "a",
    style: "in",
    // Common fields
    colorPalette: "with",
    lighting: "with",
    timeOfDay: "during",
    mood: "creating a"
  };

  // Fields to exclude from prompt
  const excludedFields = ['image', 'realism', 'seed', 'track_id', 'width', 'height', 'samples'];

  // Debug: Log config values
  console.log('🧠 Config Values:', {
    ...config,
    image: config.image ? '[IMAGE]' : null,
    excludedFields: excludedFields
  });

  const configPrompt = Object.entries(config)
    .filter(([key, value]) => {
      // Skip excluded fields
      if (excludedFields.includes(key)) {
        console.log(`⏭️ Skipping excluded field: ${key}`);
        return false;
      }

      // Skip if value is falsy or not a string
      if (!value || typeof value !== 'string') {
        console.log(`⏭️ Skipping invalid value for ${key}:`, value);
        return false;
      }

      // Skip if no prefix mapping exists
      if (!promptPrefixes[key]) {
        console.log(`⏭️ No prefix mapping for ${key}`);
        return false;
      }

      return true;
    })
    .map(([key, value]) => {
      const prefix = promptPrefixes[key];
      const promptPart = `${prefix} ${value}`.trim();
      console.log(`✅ Adding to prompt: ${key} -> ${promptPart}`);
      return promptPart;
    })
    .join(', ');

  const basePrompt = "professional architectural photography, 8k uhd, highly detailed";
  const fullPrompt = configPrompt ? `${configPrompt}, ${basePrompt}` : basePrompt;

  // Debug: Log final prompt
  console.log('🧠 Final Prompt:', {
    prompt: fullPrompt,
    length: fullPrompt.length,
    parts: configPrompt ? configPrompt.split(', ') : [],
    basePrompt
  });

  if (!configPrompt) {
    console.warn('⚠️ Warning: No valid config values found for prompt. Using base prompt only.');
  }

  return fullPrompt;
}

// Helper function to strip base64 prefix if present
function cleanBase64(base64: string): string {
  return base64.replace(/^data:image\/\w+;base64,/, '');
}

export async function generateImageFromModelsLab({
  prompt,
  initImage = null,
  realism = 50,
  width = 512,
  height = 512,
  strength = 0.7
}: GenerateImageOptions): Promise<string | null> {
  // 1. API Key Validation
  const apiKey = process.env.NEXT_PUBLIC_MODELSLAB_API_KEY;
  
  console.log('🔐 API Key Debug:', {
    hasKey: !!apiKey,
    keyLength: apiKey?.length,
    keyPrefix: apiKey?.substring(0, 3)
  });

  if (!apiKey) {
    console.error('❌ API Key Missing: NEXT_PUBLIC_MODELSLAB_API_KEY is not defined');
    return null;
  }

  if (!isValidApiKey(apiKey)) {
    console.error('❌ Invalid API Key Format');
    return null;
  }

  // 2. Input Validation
  if (!prompt?.trim()) {
    console.error('❌ Empty Prompt: No prompt provided to generateImageFromModelsLab');
    return null;
  }

  try {
    // 3. Handle init_image
    let processedInitImage: string | null = null;
    if (initImage) {
      if (typeof initImage === 'string') {
        if (isValidImageUrl(initImage)) {
          processedInitImage = initImage;
          console.log('✅ Using valid image URL:', initImage);
        } else {
          console.warn('⚠️ Invalid image URL format. Ignoring init_image.');
        }
      } else if (initImage instanceof File) {
        console.log('📤 Uploading image to ImgBB...');
        processedInitImage = await uploadToImgBB(initImage);
        if (!processedInitImage) {
          console.warn('⚠️ Failed to upload image to ImgBB. Falling back to text2img.');
        }
      }
    }

    // 4. Request Body Construction
    const body = {
      key: apiKey.trim(),
      prompt: prompt.trim(),
      ...(processedInitImage ? {
        init_image: processedInitImage,
        negative_prompt: null,
        width: "512",
        height: "512",
        samples: "1",
        num_inference_steps: "30",
        safety_checker: "no",
        temp: "yes",
        enhance_prompt: "yes",
        guidance_scale: 7.5,
        strength: 0.7,
        seed: null,
        webhook: null,
        track_id: null
      } : {
        model_id: "flux",
        width: "512",
        height: "512",
        samples: "1",
        num_inference_steps: "31",
        safety_checker: "no",
        enhance_prompt: "yes",
        seed: null,
        guidance_scale: 7.5,
        tomesd: "yes",
        clip_skip: "2",
        vae: null,
        webhook: null,
        track_id: null
      })
    };

    // 5. Request Logging
    console.log("📤 Request Body:", { 
      prompt: body.prompt, 
      hasInitImage: !!processedInitImage 
    });

    // 6. Direct API Request
    const endpoint = processedInitImage
      ? 'https://modelslab.com/api/v6/images/img2img'
      : 'https://modelslab.com/image-generation/flux/fluxtext2img';

    console.log("🌐 Endpoint Used:", endpoint);
    console.log("🔐 API Key Present:", !!apiKey);
    console.log("🖼️ Uploaded Image URL:", processedInitImage);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // 7. Response Handling
    const data = await response.json();
    console.log("📥 Response:", data);

    // 8. Response Validation
    if (!response.ok || !data?.output?.[0]) {
      console.error("❌ API Error:", {
        status: response.status,
        message: data?.message || "Unknown error",
        error: data?.error
      });
      return null;
    }

    const imageUrl = data.output[0];
    if (!isValidImageUrl(imageUrl)) {
      console.error('❌ Invalid image URL returned:', imageUrl);
      return null;
    }

    console.log('✅ Image URL generated:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('❌ Fatal API Error:', error);
    return null;
  }
}

export async function generateImageFromConfig(
  config: Record<string, any>
): Promise<string | null> {
  // Clean up bad string URLs
  if (
    config.image &&
    typeof config.image === "string" &&
    !isValidImageUrl(config.image)
  ) {
    console.warn("⚠️ Config image is an invalid string URL, clearing it:", config.image);
    config.image = null;
  }

  console.log('🧠 Config Debug:', {
    hasConfig: !!config,
    hasImage: !!config.image,
    imageType: typeof config.image,
    isImageUrl: isValidImageUrl(config.image)
  });

  const prompt = buildPrompt(config);
  console.log('📝 Prompt Debug:', {
    prompt,
    promptLength: prompt?.length,
    hasPrompt: !!prompt
  });
  
  if (!prompt) {
    console.error('❌ Failed to build prompt from config');
    return null;
  }

  return generateImageFromModelsLab({
    prompt,
    initImage: config.image,
    realism: typeof config.realism === 'number' ? config.realism : 50,
    width: 512,
    height: 512,
    strength: 0.7
  });
} 