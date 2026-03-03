import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../shared/config/supabase'
import type {
  ContentItem,
  FlyerBrief,
  FlyerGenerationRequest,
  FlyerFormat,
  FlyerRenderMode,
  Thread,
} from '../../shared/config/supabase'

// Instant in tests so animation doesn't block waitFor assertions
const TYPEWRITER_MS = import.meta.env.MODE === 'test' ? 0 : 18

interface DisplayMessage {
  role: 'assistant' | 'user'
  text: string
}

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

interface InterviewResponse {
  message: string
  complete: boolean
  brief?: FlyerBrief
}

interface VariantPayload {
  id: string
  prompt: string
  image_url: string | null
}

interface FlyerInvokeResponse {
  item: ContentItem
  variants?: VariantPayload[]
}

function mergeFlyerMetadata(item: ContentItem, variants: VariantPayload[] | undefined) {
  if (item.type !== 'flyer_text' || !variants || variants.length === 0) {
    return item
  }

  let existingMetadata: Record<string, unknown> = {}
  if (item.text_output) {
    try {
      const parsed = JSON.parse(item.text_output) as Record<string, unknown>
      existingMetadata = parsed
    } catch {
      existingMetadata = {}
    }
  }

  return {
    ...item,
    text_output: JSON.stringify({
      ...existingMetadata,
      variants,
    }),
  }
}

function toPrompt(brief: FlyerBrief): string {
  return [
    `Campaign goal: ${brief.campaignGoal}`,
    `Product name: ${brief.productName}`,
    `Key details: ${brief.keyDetails}`,
    `Call to action: ${brief.cta}`,
    `Tone: ${brief.tone}`,
    `Color vibe: ${brief.colorVibe}`,
    `Font vibe: ${brief.fontVibe}`,
    `Format constraints: ${brief.formatConstraints}`,
    `Target format: ${brief.format}`,
  ].join('\n')
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
        <span className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce" />
        </span>
      </div>
    </div>
  )
}

interface Props {
  onResult: (thread: Thread, item: ContentItem) => void
}

export default function GenerateForm({ onResult }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [history, setHistory] = useState<HistoryMessage[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [interviewLoading, setInterviewLoading] = useState(true)
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current)
    }
  }, [])

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    async function startInterview() {
      const { data, error: fnError } = await supabase.functions.invoke('interview-flyer', {
        body: { history: [], message: '' },
      })

      if (fnError) {
        setError(fnError.message)
        setInterviewLoading(false)
        return
      }

      const body = data as InterviewResponse & { error?: string }
      if (body.error) {
        setError(body.error)
        setInterviewLoading(false)
        return
      }

      setHistory([{ role: 'assistant', content: body.message }])
      setInterviewLoading(false)
      startTypewriter(body.message)
    }

    startInterview()
  }, [])

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingMessage, interviewLoading])

  function startTypewriter(text: string) {
    if (TYPEWRITER_MS === 0) {
      setMessages((prev) => [...prev, { role: 'assistant', text }])
      return
    }

    let i = 0
    setStreamingMessage('')

    if (typewriterRef.current) clearInterval(typewriterRef.current)

    typewriterRef.current = setInterval(() => {
      i += 1
      setStreamingMessage(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(typewriterRef.current!)
        typewriterRef.current = null
        setMessages((prev) => [...prev, { role: 'assistant', text }])
        setStreamingMessage(null)
      }
    }, TYPEWRITER_MS)
  }

  async function triggerGeneration(brief: FlyerBrief) {
    setGenerating(true)
    setError(null)

    const selectedFormat = brief.format as FlyerFormat
    const selectedRenderMode = brief.renderMode as FlyerRenderMode
    const threadTitle = brief.campaignGoal.slice(0, 60) || 'Untitled flyer'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: threadData, error: threadError } = (await (supabase as any)
      .from('threads')
      .insert({ title: threadTitle, format: selectedFormat, render_mode: selectedRenderMode })
      .select()
      .single()) as { data: Thread | null; error: { message: string } | null }

    if (threadError || !threadData) {
      setError(threadError?.message ?? 'Failed to create thread')
      setGenerating(false)
      return
    }

    const thread: Thread = threadData
    const prompt = toPrompt(brief)

    const requestBody: FlyerGenerationRequest = {
      type: 'flyer_text',
      prompt,
      flyer: brief,
    }

    const { data, error: fnError } = await supabase.functions.invoke('generate-flyer', {
      body: requestBody,
    })

    setGenerating(false)

    if (fnError) {
      setError(fnError.message)
      return
    }

    const response = data as FlyerInvokeResponse
    const mergedItem = mergeFlyerMetadata(response.item, response.variants)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('messages').insert({
      thread_id: thread.id,
      role: 'user',
      content: prompt,
      flyer_item_id: null,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('messages').insert({
      thread_id: thread.id,
      role: 'assistant',
      content: 'Generated flyer',
      flyer_item_id: mergedItem.id,
    })

    onResult(thread, mergedItem)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = currentInput.trim()
    if (!text || interviewLoading || streamingMessage !== null || generating) return

    const newUserMessage: DisplayMessage = { role: 'user', text }
    const newMessages = [...messages, newUserMessage]
    setMessages(newMessages)
    setCurrentInput('')
    setInterviewLoading(true)
    setError(null)

    const updatedHistory: HistoryMessage[] = [...history, { role: 'user', content: text }]

    const { data, error: fnError } = await supabase.functions.invoke('interview-flyer', {
      body: { history: updatedHistory, message: text },
    })

    if (fnError) {
      setError(fnError.message)
      setInterviewLoading(false)
      return
    }

    const body = data as InterviewResponse & { error?: string }
    if (body.error) {
      setError(body.error)
      setInterviewLoading(false)
      return
    }

    const assistantHistory: HistoryMessage = { role: 'assistant', content: body.message }
    setHistory([...updatedHistory, assistantHistory])
    setInterviewLoading(false)
    startTypewriter(body.message)

    if (body.complete && body.brief) {
      triggerGeneration(body.brief)
    }
  }

  const isDisabled = interviewLoading || streamingMessage !== null || generating

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-surface text-ink border border-border rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {interviewLoading && <TypingDots />}

        {streamingMessage !== null && (
          <div className="flex justify-start">
            <div className="max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-surface text-ink border border-border rounded-bl-sm">
              {streamingMessage}
              <span className="inline-block w-px h-3.5 bg-ink-muted ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {generating ? (
        <p className="text-sm text-ink-muted text-center py-2">Generating your flyer...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={isDisabled}
            autoFocus
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!currentInput.trim() || isDisabled}
            className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            →
          </button>
        </form>
      )}
    </div>
  )
}
