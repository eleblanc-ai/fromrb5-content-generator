import { useState } from 'react'
import { supabase } from '../../shared/config/supabase'
import type {
  ContentItem,
  FlyerFormat,
  FlyerGenerationRequest,
  FlyerRenderMode,
} from '../../shared/config/supabase'

const FLYER_FORMAT_LABELS: Record<FlyerFormat, string> = {
  instagram_post: 'Instagram Post',
  instagram_story: 'Instagram Story',
}

const RENDER_MODE_LABELS: Record<FlyerRenderMode, string> = {
  ai_composed: 'AI composed',
  overlay: 'Overlay',
}

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

const INITIAL_FORM_VALUES: FlyerBriefFormValues = {
  campaignGoal: '',
  productName: '',
  keyDetails: '',
  cta: '',
  tone: '',
  colorVibe: '',
  fontVibe: '',
  formatConstraints: '',
}

interface Props {
  onResult: (item: ContentItem) => void
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

export default function GenerateForm({ onResult }: Props) {
  const [formValues, setFormValues] = useState<FlyerBriefFormValues>(INITIAL_FORM_VALUES)
  const [format, setFormat] = useState<FlyerFormat>('instagram_post')
  const [renderMode, setRenderMode] = useState<FlyerRenderMode>('ai_composed')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function isFormValid() {
    return Object.values(formValues).every((value) => value.trim().length > 0)
  }

  function toPrompt(values: FlyerBriefFormValues, selectedFormat: FlyerFormat) {
    return [
      `Campaign goal: ${values.campaignGoal}`,
      `Product name: ${values.productName}`,
      `Key details: ${values.keyDetails}`,
      `Call to action: ${values.cta}`,
      `Tone: ${values.tone}`,
      `Color vibe: ${values.colorVibe}`,
      `Font vibe: ${values.fontVibe}`,
      `Format constraints: ${values.formatConstraints}`,
      `Target format: ${selectedFormat}`,
    ].join('\n')
  }

  function handleFieldChange<K extends keyof FlyerBriefFormValues>(
    key: K,
    value: FlyerBriefFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid()) return

    setLoading(true)
    setError(null)

    const requestBody: FlyerGenerationRequest = {
      type: 'flyer_text',
      prompt: toPrompt(formValues, format),
      flyer: {
        campaignGoal: formValues.campaignGoal,
        productName: formValues.productName,
        keyDetails: formValues.keyDetails,
        cta: formValues.cta,
        tone: formValues.tone,
        colorVibe: formValues.colorVibe,
        fontVibe: formValues.fontVibe,
        formatConstraints: formValues.formatConstraints,
        format,
        renderMode,
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
    onResult(mergeFlyerMetadata(response.item, response.variants))
    setFormValues(INITIAL_FORM_VALUES)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          Campaign goal
        </label>
        <input
          value={formValues.campaignGoal}
          onChange={(e) => handleFieldChange('campaignGoal', e.target.value)}
          placeholder="Drive weekend tea tasting signups"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Product name
          </label>
          <input
            value={formValues.productName}
            onChange={(e) => handleFieldChange('productName', e.target.value)}
            placeholder="Jasmine Green Reserve"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Call to action
          </label>
          <input
            value={formValues.cta}
            onChange={(e) => handleFieldChange('cta', e.target.value)}
            placeholder="Tap to order today"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          Key details
        </label>
        <textarea
          value={formValues.keyDetails}
          onChange={(e) => handleFieldChange('keyDetails', e.target.value)}
          placeholder="First flush jasmine pearls, floral aroma, small-batch packaging"
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Tone
          </label>
          <input
            value={formValues.tone}
            onChange={(e) => handleFieldChange('tone', e.target.value)}
            placeholder="Premium and warm"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Color vibe
          </label>
          <input
            value={formValues.colorVibe}
            onChange={(e) => handleFieldChange('colorVibe', e.target.value)}
            placeholder="Lavender and charcoal"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Font vibe
          </label>
          <input
            value={formValues.fontVibe}
            onChange={(e) => handleFieldChange('fontVibe', e.target.value)}
            placeholder="Modern editorial sans"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          Format constraints
        </label>
        <textarea
          value={formValues.formatConstraints}
          onChange={(e) => handleFieldChange('formatConstraints', e.target.value)}
          placeholder="Keep safe margins for profile UI overlays"
          rows={2}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Flyer format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as FlyerFormat)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {(Object.entries(FLYER_FORMAT_LABELS) as [FlyerFormat, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Render mode
          </label>
          <select
            value={renderMode}
            onChange={(e) => setRenderMode(e.target.value as FlyerRenderMode)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {(Object.entries(RENDER_MODE_LABELS) as [FlyerRenderMode, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !isFormValid()}
        className="w-full bg-purple-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Generating...' : 'Generate flyer brief'}
      </button>
    </form>
  )
}
