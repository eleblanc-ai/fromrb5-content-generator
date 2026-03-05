import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { GoogleGenAI } from 'npm:@google/genai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview'
const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash-image'

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

interface FlyerCopyBlock {
  headline: string
  tagline: string
  body: string
  cta: string
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

function hexToColorDescription(hex: string): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex)
  if (!match) return hex

  const r = parseInt(match[1].slice(0, 2), 16) / 255
  const g = parseInt(match[1].slice(2, 4), 16) / 255
  const b = parseInt(match[1].slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min

  if (d < 0.08) {
    if (l < 0.15) return 'near black'
    if (l > 0.92) return 'near white'
    if (l < 0.4) return 'dark gray'
    if (l < 0.65) return 'medium gray'
    return 'light gray'
  }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (((g - b) / d + (g < b ? 6 : 0)) / 6) * 360
  else if (max === g) h = (((b - r) / d + 2) / 6) * 360
  else h = (((r - g) / d + 4) / 6) * 360

  const lightness = l < 0.25 ? 'deep' : l < 0.45 ? 'dark' : l < 0.65 ? 'medium' : l < 0.82 ? 'light' : 'pale'
  const saturation = s < 0.35 ? 'muted ' : ''

  let hue: string
  if (h < 20 || h >= 340) hue = 'red'
  else if (h < 45) hue = 'orange'
  else if (h < 70) hue = 'yellow'
  else if (h < 160) hue = 'green'
  else if (h < 200) hue = 'teal'
  else if (h < 255) hue = 'blue'
  else if (h < 290) hue = 'purple'
  else if (h < 340) hue = 'pink'
  else hue = 'red'

  return `${lightness} ${saturation}${hue}`
}

interface BrandContext {
  name: string
  tagline: string
  colorPalette: string[]
}

async function generateCopyBlock(flyer: FlyerBrief, apiKey: string, brand?: BrandContext): Promise<FlyerCopyBlock> {
  const anthropic = new Anthropic({ apiKey })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          'Generate concise flyer copy for a premium tea brand.',
          'Return ONLY valid JSON with exactly these fields: headline, tagline, body, cta.',
          'headline: under 6 words. tagline: under 8 words. body: under 20 words. cta: under 5 words.',
          `Campaign goal: ${flyer.campaignGoal}`,
          `Product: ${flyer.productName}`,
          `Key details: ${flyer.keyDetails}`,
          `CTA hint: ${flyer.cta}`,
          `Tone: ${flyer.tone}`,
          ...(brand?.name ? [`Brand name: ${brand.name}`] : []),
          ...(brand?.tagline ? [`Brand tagline: ${brand.tagline}`] : []),
          'Return JSON only — no markdown, no explanation.',
        ].join('\n'),
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    return JSON.parse(text) as FlyerCopyBlock
  } catch {
    return {
      headline: flyer.productName,
      tagline: flyer.campaignGoal,
      body: flyer.keyDetails,
      cta: flyer.cta,
    }
  }
}

function getFormatInstructions(format: FlyerFormat) {
  if (format === 'instagram_story') {
    return 'Canvas: 1080x1920 vertical composition for Instagram Story. Keep key text centered away from top/bottom UI overlays.'
  }

  return 'Canvas: 1080x1080 square composition for Instagram Post. Keep balanced hierarchy and center-safe margins.'
}

function buildFlyerImagePrompt(flyer: FlyerBrief, copy: FlyerCopyBlock, refinementMessage?: string, brand?: BrandContext): string {
  const formatInstructions = getFormatInstructions(flyer.format)
  const refinementSuffix = refinementMessage ? `\nRefinement request: "${refinementMessage}"` : ''

  // Describe where text will land so Gemini can reserve clear zones
  const zoneGuide = flyer.format === 'instagram_story'
    ? [
        'TEXT ZONE GUIDE — leave these areas clear with high contrast for programmatic text overlay:',
        `  • Upper center (25–45% from top): large headline — "${copy.headline}" — and tagline — "${copy.tagline}"`,
        `  • Center (48–56% from top): body copy — "${copy.body}"`,
        `  • Lower center (60–68% from top): CTA — "${copy.cta}"`,
        '  Keep these zones free of busy detail, busy patterns, or faces. Use gentle gradients or negative space there.',
      ].join('\n')
    : [
        'TEXT ZONE GUIDE — leave these areas clear with high contrast for programmatic text overlay:',
        `  • Upper-center (30–46% from top): large headline — "${copy.headline}" — and tagline — "${copy.tagline}"`,
        `  • Center (48–55% from top): body copy — "${copy.body}"`,
        `  • Lower-center (58–66% from top): CTA — "${copy.cta}"`,
        '  Keep these zones free of busy detail, patterns, or faces. Use gentle gradients or negative space there.',
      ].join('\n')

  return [
    'Create a background-only image for a premium tea brand flyer.',
    'CRITICAL: NO text, NO lettering, NO words, NO numbers, NO typography of any kind anywhere in the image.',
    'Pure visual composition only — textures, gradients, product photography, botanical elements.',
    zoneGuide,
    formatInstructions,
    ...(brand?.colorPalette?.length
      ? [`PRIMARY COLOR PALETTE — use these colors exclusively as the dominant tones: ${brand.colorPalette.map((hex) => `${hexToColorDescription(hex)} (${hex})`).join(', ')}`]
      : [`Color vibe: ${flyer.colorVibe}`]),
    ...(brand?.colorPalette?.length ? [`Mood/atmosphere reference (secondary only): ${flyer.colorVibe}`] : []),
    ...(brand?.name ? [`Brand identity: ${brand.name}${brand.tagline ? ` — ${brand.tagline}` : ''}`] : []),
    `Brand tone: ${flyer.tone}`,
    `Constraints: ${flyer.formatConstraints}`,
    'Design style: premium, calm, editorial tea brand aesthetic.',
    'Output must be a completely text-free background image optimised for programmatic text overlay.',
  ].join('\n') + refinementSuffix
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type, flyer, parentId, sourceImageUrl, copyOverride, refinementMessage, threadId } = (await req.json()) as {
      prompt: string
      type: 'flyer_text'
      flyer: FlyerBrief
      parentId?: string
      sourceImageUrl?: string
      copyOverride?: FlyerCopyBlock
      refinementMessage?: string
      threadId?: string
    }

    if (!prompt || !flyer || type !== 'flyer_text') {
      return new Response(JSON.stringify({ error: 'type=flyer_text, prompt, and flyer are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: brandRow } = await supabase
      .from('brand_settings')
      .select('brand_name, brand_tagline, color_palette')
      .limit(1)
      .maybeSingle() as { data: { brand_name: string; brand_tagline: string; color_palette: string[] } | null }

    const brand: BrandContext | undefined = brandRow
      ? { name: brandRow.brand_name, tagline: brandRow.brand_tagline, colorPalette: brandRow.color_palette }
      : undefined

    const copy = copyOverride ?? await generateCopyBlock(flyer, Deno.env.get('ANTHROPIC_API_KEY') ?? '', brand)

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

    const imagePrompt = buildFlyerImagePrompt(flyer, copy, refinementMessage, brand)

    const contents = sourceInlineData
      ? [
          {
            role: 'user' as const,
            parts: [
              { text: imagePrompt },
              { inlineData: sourceInlineData },
            ],
          },
        ]
      : imagePrompt

    const generateWithFallback = async () => {
      try {
        return await ai.models.generateContent({
          model: GEMINI_IMAGE_MODEL,
          contents,
          config: { responseModalities: ['IMAGE'] },
        })
      } catch (err) {
        const msg = (err as Error).message ?? ''
        if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
          return await ai.models.generateContent({
            model: GEMINI_FALLBACK_MODEL,
            contents,
            config: { responseModalities: ['IMAGE'] },
          })
        }
        throw err
      }
    }

    const response = await generateWithFallback()

    const imagePart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
    if (!imagePart?.inlineData) {
      throw new Error('No flyer image returned from Gemini')
    }

    const { data: imageBase64, mimeType } = imagePart.inlineData
    const extension = mimeType?.includes('jpeg') ? 'jpg' : 'png'
    const basename = `flyer-${flyer.format}-${crypto.randomUUID()}.${extension}`
    const filename = threadId ? `${threadId}/${basename}` : basename
    const imageBytes = Uint8Array.from(atob(imageBase64 ?? ''), (c) => c.charCodeAt(0))

    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(filename, imageBytes, { contentType: mimeType ?? 'image/png' })

    if (uploadError) throw new Error(uploadError.message)

    const {
      data: { publicUrl },
    } = supabase.storage.from('content-images').getPublicUrl(filename)

    const metadataText = JSON.stringify({ flyer, copy })

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

    const storedVariant = data as StoredVariant

    const primaryItem = {
      id: storedVariant.id,
      type: 'flyer_text',
      prompt,
      text_output: JSON.stringify({
        flyer,
        variants: [storedVariant],
        copy,
      }),
      image_url: storedVariant.image_url,
      parent_id: parentId ?? null,
      created_at: new Date().toISOString(),
    }

    return new Response(JSON.stringify({ item: primaryItem, variants: [storedVariant] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
