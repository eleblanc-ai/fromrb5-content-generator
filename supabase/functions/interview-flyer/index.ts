import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a warm, concise creative director conducting a quick interview to gather flyer brief details for a premium tea brand.

You need to collect EXACTLY these fields:
- productName: the specific product being promoted
- campaignGoal: what this flyer should achieve
- keyDetails: key selling points, ingredients, or details to highlight
- cta: the call-to-action text
- tone: the visual/verbal tone (e.g. "premium and warm")
- colorVibe: color palette direction (e.g. "lavender and charcoal")
- fontVibe: typography direction (e.g. "modern editorial sans")
- formatConstraints: any layout or safe-zone constraints (default to "none" if not mentioned)
- format: MUST be exactly "instagram_post" or "instagram_story"

Guidelines:
- Ask follow-up questions naturally. You can collect multiple fields per exchange if the user gives rich answers.
- Keep questions short and conversational.
- When you have enough for all fields, stop asking and output the complete brief.

ALWAYS respond with ONLY valid JSON — no extra text, no markdown fences:
- While still collecting: {"message": "your next question", "complete": false}
- When you have all fields: {"message": "Perfect, I have everything I need — generating your flyer now!", "complete": true, "brief": {"productName": "...", "campaignGoal": "...", "keyDetails": "...", "cta": "...", "tone": "...", "colorVibe": "...", "fontVibe": "...", "formatConstraints": "...", "format": "instagram_post", "renderMode": "overlay"}}`

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { history, message } = (await req.json()) as {
      history: HistoryMessage[]
      message: string
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })

    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      ...(message ? [{ role: 'user' as const, content: message }] : []),
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Start the interview.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Strip markdown code fences if Claude wraps the JSON
    const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      // Claude didn't return valid JSON — wrap the raw text as a message and continue
      parsed = { message: json || 'What product are we making this flyer for?', complete: false }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // Return 200 so the client can read the error body (supabase-js swallows non-2xx bodies)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
