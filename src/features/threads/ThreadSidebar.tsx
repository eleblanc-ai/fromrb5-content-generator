import type { Thread } from '../../shared/config/supabase'

interface Props {
  threads: Thread[]
  activeThreadId: string | null
  onSelect: (thread: Thread) => void
  onNewThread: () => void
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ThreadSidebar({ threads, activeThreadId, onSelect, onNewThread }: Props) {
  return (
    <aside className="w-64 border-r border-border flex flex-col shrink-0 h-full">
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewThread}
          className="w-full bg-purple-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          New flyer
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Flyer threads">
        {threads.length === 0 ? (
          <p className="px-4 py-3 text-xs text-ink-muted">No flyers yet</p>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelect(thread)}
              aria-current={activeThreadId === thread.id ? 'true' : undefined}
              className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-purple-50 transition-colors ${
                activeThreadId === thread.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
              }`}
            >
              <span className="text-sm text-ink truncate">{thread.title}</span>
              <span className="text-xs text-ink-muted">{formatRelativeDate(thread.created_at)}</span>
            </button>
          ))
        )}
      </nav>
    </aside>
  )
}
