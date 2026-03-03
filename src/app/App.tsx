import { useCallback, useEffect, useState } from 'react'
import { GenerateForm } from '../features/generate'
import { ThreadSidebar, ThreadView } from '../features/threads'
import { supabase } from '../shared/config/supabase'
import type { ContentItem, Message, Thread } from '../shared/config/supabase'

type ViewMode = 'new-thread' | 'thread'

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null)
  const [itemLoading, setItemLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('new-thread')

  const loadThreadItem = useCallback(async (thread: Thread) => {
    setActiveThread(thread)
    setActiveItem(null)
    setItemLoading(true)
    setViewMode('thread')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawMessages } = (await (supabase as any)
      .from('messages')
      .select('*')
      .eq('thread_id', thread.id)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)) as { data: Message[] | null; error: unknown }

    if (rawMessages && rawMessages.length > 0 && rawMessages[0].flyer_item_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: item } = (await (supabase as any)
        .from('content_items')
        .select('*')
        .eq('id', rawMessages[0].flyer_item_id)
        .single()) as { data: ContentItem | null; error: unknown }
      setActiveItem(item ?? null)
    }

    setItemLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    async function loadThreads() {
      const { data } = await supabase
        .from('threads')
        .select('*')
        .order('created_at', { ascending: false })

      if (!active) return

      const loaded = data ?? []
      setThreads(loaded)

      if (loaded.length > 0) {
        loadThreadItem(loaded[0])
      }
    }

    loadThreads()

    return () => {
      active = false
    }
  }, [loadThreadItem])

  function handleResult(thread: Thread, item: ContentItem) {
    setThreads((ts) => [thread, ...ts.filter((t) => t.id !== thread.id)])
    setActiveThread(thread)
    setActiveItem(item)
    setViewMode('thread')
  }

  function handleNewThread() {
    setActiveThread(null)
    setActiveItem(null)
    setViewMode('new-thread')
  }

  function handleThreadDeleted() {
    if (!activeThread) return
    setThreads((ts) => ts.filter((t) => t.id !== activeThread.id))
    setActiveThread(null)
    setActiveItem(null)
    setViewMode('new-thread')
  }

  return (
    <div className="h-screen flex flex-col bg-canvas text-ink">
      <header className="border-b border-border px-8 py-5 shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Content Studio</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ThreadSidebar
          threads={threads}
          activeThreadId={activeThread?.id ?? null}
          onSelect={loadThreadItem}
          onNewThread={handleNewThread}
        />

        <main className="flex-1 overflow-y-auto">
          {viewMode === 'new-thread' ? (
            <div className="max-w-2xl mx-auto px-8 py-12">
              <GenerateForm onResult={handleResult} />
            </div>
          ) : activeThread ? (
            <ThreadView
              thread={activeThread}
              item={activeItem}
              loading={itemLoading}
              onItemChanged={setActiveItem}
              onThreadDeleted={handleThreadDeleted}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}
