import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenAI } from 'npm:@google/genai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview'

type FlyerFormat = 'instagram_post' | 'instagram_story'
type FlyerRenderMode = 'ai_composed' | 'overlay'

interface FlyerBrief {
  campaignGoal: string
  productName: string
  keyDetails: string
  cta: string
  tone: string
  colorVibe: string
  fontVibe: string
  formatConstraints: string
  format: FlyerFormat
  renderMode: FlyerRenderMode
}

interface StoredVariant {
  id: string
  prompt: string
  image_url: string | null
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function getFormatInstructions(format: FlyerFormat) {
  if (format === 'instagram_story') {
    return 'Canvas: 1080x1920 vertical composition for Instagram Story. Keep key text centered away from top/bottom UI overlays.'
  }

  return 'Canvas: 1080x1080 square composition for Instagram Post. Keep balanced hierarchy and center-safe margins.'
}

function buildFlyerImagePrompt(flyer: FlyerBrief) {
  const formatInstructions = getFormatInstructions(flyer.format)

  if (flyer.renderMode === 'overlay') {
    return [
      'Create a final marketing flyer image for a premium tea brand.',
      'Use a clean, high-contrast composition designed as if text is precisely laid out in structured blocks.',
      'Include all required copy content in the final image output.',
      formatInstructions,
      `Campaign goal: ${flyer.campaignGoal}`,
      `Product name: ${flyer.productName}`,
      `Key details: ${flyer.keyDetails}`,
      `CTA: ${flyer.cta}`,
      `Tone: ${flyer.tone}`,
      `Color vibe: ${flyer.colorVibe}`,
      `Font vibe: ${flyer.fontVibe}`,
      `Constraints: ${flyer.formatConstraints}`,
      'Design style: premium, calm, editorial tea brand aesthetic.',
      'Output must be one complete, publish-ready flyer image.',
    ].join('\n')
  }

  return [
    'Create one complete, publish-ready marketing flyer image for a premium tea brand with text baked in.',
    formatInstructions,
    `Campaign goal: ${flyer.campaignGoal}`,
    `Product name: ${flyer.productName}`,
    `Key details: ${flyer.keyDetails}`,
    `CTA: ${flyer.cta}`,
    `Tone: ${flyer.tone}`,
    `Color vibe: ${flyer.colorVibe}`,
    `Font vibe: ${flyer.fontVibe}`,
    `Constraints: ${flyer.formatConstraints}`,
    'Design style: premium, calm, editorial tea brand aesthetic.',
    'The final image must be legible for social posting.',
  ].join('\n')
}

function buildVariantPrompt(flyer: FlyerBrief, variantIndex: number) {
  return [
    buildFlyerImagePrompt(flyer),
    `Create distinct creative direction variant ${variantIndex} of 3 while preserving the core campaign message.`,
    'Vary composition, visual rhythm, and emphasis across variants.',
  ].join('\n\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type, flyer, parentId, sourceImageUrl } = (await req.json()) as {
      prompt: string
      type: 'flyer_text'
      flyer: FlyerBrief
      parentId?: string
      sourceImageUrl?: string
    }

    if (!prompt || !flyer || type !== 'flyer_text') {
      return new Response(JSON.stringify({ error: 'type=flyer_text, prompt, and flyer are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY') ?? '' })

    let sourceInlineData:
      | { mimeType: string; data: string }
      | undefined

    if (sourceImageUrl) {
      const sourceResponse = await fetch(sourceImageUrl)
      if (!sourceResponse.ok) {
        throw new Error('Failed to load selected variant image for regenerate')
      }

      const sourceBytes = new Uint8Array(await sourceResponse.arrayBuffer())
      sourceInlineData = {
        mimeType: sourceResponse.headers.get('content-type') ?? 'image/png',
        data: bytesToBase64(sourceBytes),
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const storedVariants: StoredVariant[] = []

    for (let index = 1; index <= 3; index += 1) {
      const variantPrompt = buildVariantPrompt(flyer, index)

      const contents = sourceInlineData
        ? [
            {
              role: 'user' as const,
              parts: [
                { text: variantPrompt },
                {
                  inlineData: sourceInlineData,
                },
              ],
            },
          ]
        : variantPrompt

      const response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents,
        config: {
          responseModalities: ['IMAGE'],
        },
      })

      const imagePart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
      if (!imagePart?.inlineData) {
        throw new Error(`No flyer image returned from Gemini for variant ${index}`)
      }

      const { data: imageBase64, mimeType } = imagePart.inlineData
      const extension = mimeType?.includes('jpeg') ? 'jpg' : 'png'
      const filename = `flyer-${flyer.format}-v${index}-${crypto.randomUUID()}.${extension}`
      const imageBytes = Uint8Array.from(atob(imageBase64 ?? ''), (c) => c.charCodeAt(0))

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filename, imageBytes, { contentType: mimeType ?? 'image/png' })

      if (uploadError) throw new Error(uploadError.message)

      const {
        data: { publicUrl },
      } = supabase.storage.from('content-images').getPublicUrl(filename)

      const metadataText = JSON.stringify({
        flyer,
        variantIndex: index,
      })

      const { data, error } = await supabase
        .from('content_items')
        .insert({
          type: 'flyer_text',
          prompt,
          text_output: metadataText,
          image_url: publicUrl,
          parent_id: parentId ?? null,
        })
        .select('id, prompt, image_url')
        .single()

      if (error) throw new Error(error.message)

      storedVariants.push(data as StoredVariant)
    }

    const [primaryVariant] = storedVariants
    const metadataText = JSON.stringify({
      flyer,
      variantIndex: 1,
      variants: storedVariants,
    })

    const primaryItem = {
      id: primaryVariant.id,
      type: 'flyer_text',
      prompt,
      text_output: metadataText,
      image_url: primaryVariant.image_url,
      parent_id: parentId ?? null,
      created_at: new Date().toISOString(),
    }

    return new Response(JSON.stringify({ item: primaryItem, variants: storedVariants }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
