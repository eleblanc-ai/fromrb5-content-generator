import type { Thread, ContentItem } from '../../shared/config/supabase'
import { ResultCard } from '../generate'

interface Props {
  thread: Thread
  item: ContentItem | null
  loading?: boolean
  onItemChanged: (item: ContentItem) => void
  onThreadDeleted: () => void
}

export default function ThreadView({
  thread,
  item,
  loading,
  onItemChanged,
  onThreadDeleted,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
      <header>
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">
          {thread.title}
        </h2>
      </header>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : item ? (
        <ResultCard
          item={item}
          onIterated={onItemChanged}
          onDeleted={onThreadDeleted}
        />
      ) : (
        <p className="text-sm text-ink-muted">No output yet.</p>
      )}
    </div>
  )
}
