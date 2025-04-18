import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Replicate } from 'replicate'
import type { RenderRequest } from '@/types/studio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const { renderType, config, sourceImage } = await request.json() as RenderRequest

    // Verify user has credits
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.user.id)
      .single()

    if (!userData || userData.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Generate prompt based on config
    const prompt = generatePrompt(renderType, config)

    // Call Replicate API
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt,
          image: sourceImage,
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5,
        }
      }
    )

    // Deduct credit and save render
    await supabase
      .from('users')
      .update({ credits: userData.credits - 1 })
      .eq('id', user.user.id)

    await supabase
      .from('renders')
      .insert({
        user_id: user.user.id,
        render_type: renderType,
        config,
        source_image_url: sourceImage,
        result_image_url: output[0],
        prompt,
      })

    return NextResponse.json({
      imageUrl: output[0],
      prompt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Render error:', error)
    return NextResponse.json(
      { error: 'Failed to process render request' },
      { status: 500 }
    )
  }
}

function generatePrompt(renderType: string, config: any): string {
  // This is a simplified version - you'll want to expand this based on your specific needs
  const basePrompt = `A ${config.style} ${renderType} design with ${config.colorPalette} color palette`
  
  switch (renderType) {
    case 'interior':
      return `${basePrompt}, ${config.roomType} with ${config.furnitureStyle} furniture`
    case 'exterior':
      return `${basePrompt}, ${config.buildingType} in ${config.architecturalStyle} style`
    case 'product':
      return `${basePrompt}, ${config.productType} made of ${config.material}`
    default:
      return basePrompt
  }
} 