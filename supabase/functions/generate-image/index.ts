import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenAI } from 'npm:@google/genai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NOTE: Verify this model name against your Google AI Studio account.
// The spec value is 'gemini-3-pro-image-preview' — update here if your
// account uses a different name (e.g. 'gemini-2.0-flash-preview-image-generation').
const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = (await req.json()) as { prompt: string }

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY') ?? '' })

    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    })

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData,
    )

    if (!imagePart?.inlineData) {
      throw new Error('No image returned from Gemini')
    }

    const { data: imageBase64, mimeType } = imagePart.inlineData
    const extension = mimeType?.includes('jpeg') ? 'jpg' : 'png'
    const filename = `${crypto.randomUUID()}.${extension}`

    const imageBytes = Uint8Array.from(atob(imageBase64 ?? ''), (c) => c.charCodeAt(0))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(filename, imageBytes, { contentType: mimeType ?? 'image/png' })

    if (uploadError) throw new Error(uploadError.message)

    const {
      data: { publicUrl },
    } = supabase.storage.from('content-images').getPublicUrl(filename)

    const { data, error } = await supabase
      .from('content_items')
      .insert({ type: 'image', prompt, image_url: publicUrl })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ item: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
