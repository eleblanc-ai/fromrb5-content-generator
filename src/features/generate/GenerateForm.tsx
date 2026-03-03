import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../shared/config/supabase'
import type {
  ContentItem,
  FlyerFormat,
  FlyerGenerationRequest,
  FlyerRenderMode,
  Thread,
} from '../../shared/config/supabase'

interface FlyerBriefFormValues {
  campaignGoal: string
  productName: string
  keyDetails: string
  cta: string
  tone: string
  colorVibe: string
  fontVibe: string
  formatConstraints: string
}

interface InterviewMessage {
  role: 'assistant' | 'user'
  text: string
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

type TextStepField = keyof FlyerBriefFormValues
type ChoiceStepField = 'format' | 'renderMode'
type StepField = TextStepField | ChoiceStepField

interface Step {
  field: StepField
  question: string
}

const STEPS: Step[] = [
  { field: 'productName', question: 'What product are we making this flyer for?' },
  { field: 'campaignGoal', question: "What's the campaign goal — what should this flyer achieve?" },
  { field: 'keyDetails', question: 'What key details should we highlight? (ingredients, USPs, availability, etc.)' },
  { field: 'cta', question: "What's the call to action?" },
  { field: 'tone', question: "What tone are you going for? (e.g. 'premium and warm', 'playful and bold')" },
  { field: 'colorVibe', question: "What's your color vibe?" },
  { field: 'fontVibe', question: "Any font preferences? (e.g. 'modern editorial sans', 'classic serif')" },
  { field: 'formatConstraints', question: 'Any layout constraints to keep in mind?' },
  { field: 'format', question: 'Which format?' },
  { field: 'renderMode', question: 'How should the text be handled?' },
]

const FORMAT_OPTIONS: { value: FlyerFormat; label: string }[] = [
  { value: 'instagram_post', label: 'Instagram Post' },
  { value: 'instagram_story', label: 'Instagram Story' },
]

const RENDER_MODE_OPTIONS: { value: FlyerRenderMode; label: string }[] = [
  { value: 'ai_composed', label: 'AI composed' },
  { value: 'overlay', label: 'Overlay' },
]

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

function toPrompt(values: FlyerBriefFormValues, format: FlyerFormat): string {
  return [
    `Campaign goal: ${values.campaignGoal}`,
    `Product name: ${values.productName}`,
    `Key details: ${values.keyDetails}`,
    `Call to action: ${values.cta}`,
    `Tone: ${values.tone}`,
    `Color vibe: ${values.colorVibe}`,
    `Font vibe: ${values.fontVibe}`,
    `Format constraints: ${values.formatConstraints}`,
    `Target format: ${format}`,
  ].join('\n')
}

interface Props {
  onResult: (thread: Thread, item: ContentItem) => void
}

export default function GenerateForm({ onResult }: Props) {
  const [messages, setMessages] = useState<InterviewMessage[]>([
    { role: 'assistant', text: STEPS[0].question },
  ])
  const [step, setStep] = useState(0)
  const [currentInput, setCurrentInput] = useState('')
  const [answers, setAnswers] = useState<Partial<FlyerBriefFormValues & { format: FlyerFormat; renderMode: FlyerRenderMode }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function triggerGeneration(
    finalAnswers: FlyerBriefFormValues,
    selectedFormat: FlyerFormat,
    selectedRenderMode: FlyerRenderMode,
  ) {
    setLoading(true)
    setError(null)

    const threadTitle = finalAnswers.campaignGoal.slice(0, 60) || 'Untitled flyer'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: threadData, error: threadError } = (await (supabase as any)
      .from('threads')
      .insert({ title: threadTitle, format: selectedFormat, render_mode: selectedRenderMode })
      .select()
      .single()) as { data: Thread | null; error: { message: string } | null }

    if (threadError || !threadData) {
      setError(threadError?.message ?? 'Failed to create thread')
      setLoading(false)
      return
    }

    const thread: Thread = threadData

    const requestBody: FlyerGenerationRequest = {
      type: 'flyer_text',
      prompt: toPrompt(finalAnswers, selectedFormat),
      flyer: {
        campaignGoal: finalAnswers.campaignGoal,
        productName: finalAnswers.productName,
        keyDetails: finalAnswers.keyDetails,
        cta: finalAnswers.cta,
        tone: finalAnswers.tone,
        colorVibe: finalAnswers.colorVibe,
        fontVibe: finalAnswers.fontVibe,
        formatConstraints: finalAnswers.formatConstraints,
        format: selectedFormat,
        renderMode: selectedRenderMode,
      },
    }

    const { data, error: fnError } = await supabase.functions.invoke('generate-flyer', {
      body: requestBody,
    })

    setLoading(false)

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
      content: requestBody.prompt,
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

  function advanceToStep(nextStep: number, newMessages: InterviewMessage[]) {
    if (nextStep < STEPS.length) {
      setMessages([...newMessages, { role: 'assistant', text: STEPS[nextStep].question }])
      setStep(nextStep)
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = currentInput.trim()
    if (!text || loading) return

    const field = STEPS[step].field as TextStepField
    const newAnswers = { ...answers, [field]: text }
    const newMessages: InterviewMessage[] = [...messages, { role: 'user', text }]

    setAnswers(newAnswers)
    setCurrentInput('')
    advanceToStep(step + 1, newMessages)
  }

  function handleChoiceSelect(field: ChoiceStepField, value: string, label: string) {
    const newAnswers = { ...answers, [field]: value }
    const newMessages: InterviewMessage[] = [...messages, { role: 'user', text: label }]

    setAnswers(newAnswers)

    const nextStep = step + 1
    if (nextStep < STEPS.length) {
      advanceToStep(nextStep, newMessages)
    } else {
      // All questions answered — generate
      setMessages(newMessages)
      setStep(nextStep)

      const finalAnswers = newAnswers as FlyerBriefFormValues & { format: FlyerFormat; renderMode: FlyerRenderMode }
      triggerGeneration(finalAnswers, finalAnswers.format, finalAnswers.renderMode)
    }
  }

  const currentStep = STEPS[step]
  const isChoiceStep = currentStep?.field === 'format' || currentStep?.field === 'renderMode'
  const isDone = step >= STEPS.length

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
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-muted text-center py-2">Generating your flyer...</p>
      ) : isDone ? null : isChoiceStep ? (
        <div className="flex gap-2">
          {(currentStep.field === 'format' ? FORMAT_OPTIONS : RENDER_MODE_OPTIONS).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChoiceSelect(currentStep.field as ChoiceStepField, opt.value, opt.label)}
              className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:border-purple-400 hover:text-purple-600 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="Type your answer..."
            autoFocus
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            disabled={!currentInput.trim()}
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
