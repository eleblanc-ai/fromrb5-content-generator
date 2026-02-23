import { useState } from 'react'
import { supabase } from '../../shared/config/supabase'
import type { ContentItem } from '../../shared/config/supabase'

type TextContentType = 'flyer_text' | 'tea_writeup' | 'communication'

const CONTENT_TYPE_LABELS: Record<TextContentType, string> = {
  flyer_text: 'Flyer copy',
  tea_writeup: 'Tea writeup',
  communication: 'Communication',
}

interface Props {
  onResult: (item: ContentItem) => void
}

export default function GenerateForm({ onResult }: Props) {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<TextContentType>('tea_writeup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('generate-text', {
      body: { prompt, type },
    })

    setLoading(false)

    if (fnError) {
      setError(fnError.message)
      return
    }

    onResult(data.item as ContentItem)
    setPrompt('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          Content type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TextContentType)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {(Object.entries(CONTENT_TYPE_LABELS) as [TextContentType, string][]).map(
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
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you need..."
          rows={4}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full bg-purple-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </form>
  )
}
