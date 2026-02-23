import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TextContentType = 'flyer_text' | 'tea_writeup' | 'communication'

const systemPrompts: Record<TextContentType, string> = {
  flyer_text:
    'You are a copywriter for a premium tea brand. Write compelling, editorial-style marketing copy for flyers. Be concise, evocative, and brand-consistent. Focus on quality, origin, and sensory experience.',
  tea_writeup:
    'You are a tea sommelier writing product descriptions for a premium tea brand. Include flavor notes, origin, character, and suggested brewing details. Write with expertise and warmth.',
  communication:
    'You are a marketing writer for a premium tea brand. Write professional, warm communications suitable for emails and social media captions. Match the tone to a quality, artisanal tea brand.',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type } = (await req.json()) as { prompt: string; type: TextContentType }

    if (!prompt || !type) {
      return new Response(JSON.stringify({ error: 'prompt and type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['flyer_text', 'tea_writeup', 'communication'].includes(type)) {
      return new Response(JSON.stringify({ error: 'invalid content type for text generation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompts[type],
      messages: [{ role: 'user', content: prompt }],
    })

    const textOutput =
      message.content[0].type === 'text' ? message.content[0].text : ''

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data, error } = await supabase
      .from('content_items')
      .insert({ type, prompt, text_output: textOutput })
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
