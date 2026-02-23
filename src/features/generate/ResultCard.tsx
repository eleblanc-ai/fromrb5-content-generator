import type { ContentItem } from '../../shared/config/supabase'

const TYPE_LABELS: Record<string, string> = {
  flyer_text: 'Flyer copy',
  tea_writeup: 'Tea writeup',
  communication: 'Communication',
  image: 'Image',
}

interface Props {
  item: ContentItem
}

export default function ResultCard({ item }: Props) {
  return (
    <div className="border border-border rounded-lg p-6 space-y-3 bg-surface">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
      </div>
      <p className="text-xs text-ink-muted italic">{item.prompt}</p>
      {item.text_output && (
        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{item.text_output}</p>
      )}
      {item.image_url && (
        <img src={item.image_url} alt={item.prompt} className="w-full rounded-lg" />
      )}
    </div>
  )
}
