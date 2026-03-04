import { useCallback, useEffect, useState } from 'react'
import { GenerateForm } from '../features/generate'
import { ThreadSidebar, ThreadView } from '../features/threads'
import { BrandSettingsPanel } from '../features/brand'
import { supabase } from '../shared/config/supabase'
import type { ContentItem, Message, Thread } from '../shared/config/supabase'

type ViewMode = 'new-thread' | 'thread'

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null)
  const [itemLoading, setItemLoading] = useState(false)
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('new-thread')
  const [resumeThread, setResumeThread] = useState<Thread | null>(null)
  const [resumeMessages, setResumeMessages] = useState<Message[]>([])
  const [showBrandKit, setShowBrandKit] = useState(false)

  const loadThreadItem = useCallback(async (thread: Thread) => {
    setActiveItem(null)
    setItemLoading(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawMessages } = (await (supabase as any)
      .from('messages')
      .select('*')
      .eq('thread_id', thread.id)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)) as { data: Message[] | null; error: unknown }

    if (rawMessages && rawMessages.length > 0 && rawMessages[0].flyer_item_id) {
      // Completed thread: load flyer item and show ThreadView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: item } = (await (supabase as any)
        .from('content_items')
        .select('*')
        .eq('id', rawMessages[0].flyer_item_id)
        .single()) as { data: ContentItem | null; error: unknown }
      setActiveThread(thread)
      setActiveItem(item ?? null)
      setViewMode('thread')
    } else {
      // In-progress thread: load all messages and resume GenerateForm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allMessages } = (await (supabase as any)
        .from('messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true })) as { data: Message[] | null; error: unknown }
      setActiveThread(thread)
      setResumeThread(thread)
      setResumeMessages(allMessages ?? [])
      setViewMode('new-thread')
    }

    setItemLoading(false)
    setThreadsLoading(false)
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
      } else {
        setThreadsLoading(false)
      }
    }

    loadThreads()

    return () => {
      active = false
    }
  }, [loadThreadItem])

  function handleResult(thread: Thread, item: ContentItem) {
    setResumeThread(null)
    setResumeMessages([])
    setThreads((ts) => [thread, ...ts.filter((t) => t.id !== thread.id)])
    setActiveThread(thread)
    setActiveItem(item)
    setViewMode('thread')
  }

  function handleThreadStarted(thread: Thread) {
    setThreads((ts) => [thread, ...ts.filter((t) => t.id !== thread.id)])
  }

  function handleNewThread() {
    setResumeThread(null)
    setResumeMessages([])
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

  async function handleDeleteThread(threadId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('messages').delete().eq('thread_id', threadId)
    await supabase.from('threads').delete().eq('id', threadId)
    setThreads((ts) => ts.filter((t) => t.id !== threadId))
    if (activeThread?.id === threadId) {
      setActiveThread(null)
      setActiveItem(null)
      setViewMode('new-thread')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-canvas text-ink">
      <header className="border-b border-border px-8 py-5 shrink-0 flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">Content Studio</h1>
        <button
          type="button"
          onClick={() => setShowBrandKit(true)}
          className="text-xs text-ink-muted hover:text-ink transition-colors"
        >
          Brand Kit
        </button>
      </header>

      {showBrandKit && <BrandSettingsPanel onClose={() => setShowBrandKit(false)} />}

      <div className="flex flex-1 overflow-hidden">
        <ThreadSidebar
          threads={threads}
          activeThreadId={activeThread?.id ?? null}
          onSelect={loadThreadItem}
          onNewThread={handleNewThread}
          onDelete={handleDeleteThread}
        />

        <main className="flex-1 overflow-hidden">
          {!threadsLoading && viewMode === 'new-thread' ? (
            <div className="h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto px-8 py-12">
                <GenerateForm
                  key={activeThread?.id ?? 'new-thread'}
                  onResult={handleResult}
                  onThreadStarted={handleThreadStarted}
                  resumeThread={resumeThread ?? undefined}
                  resumeMessages={resumeMessages.length > 0 ? resumeMessages : undefined}
                />
              </div>
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
