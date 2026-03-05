import { useEffect, useState } from 'react'
import { supabase } from '../../shared/config/supabase'
import type { ContentItem, FlyerBrief, FlyerGenerationRequest, Message, Thread } from '../../shared/config/supabase'
import { FlyerEditor } from '../generate'

interface Props {
  thread: Thread
  item: ContentItem | null
  loading?: boolean
  logoUrl?: string | null
  onItemChanged: (item: ContentItem) => void
  onThreadDeleted: () => void
}

export default function ThreadView({
  thread,
  item,
  loading,
  logoUrl,
  onItemChanged,
  onThreadDeleted,
}: Props) {
  const [dbMessages, setDbMessages] = useState<Message[]>([])
  const [refinementInput, setRefinementInput] = useState('')
  const [refining, setRefining] = useState(false)
  const [refinementError, setRefinementError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadMessages() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = (await (supabase as any)
        .from('messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true })) as { data: Message[] | null; error: unknown }

      if (!active) return
      setDbMessages(data ?? [])
    }

    loadMessages()

    return () => {
      active = false
    }
  }, [thread.id])

  async function handleItemChanged(newItem: ContentItem) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('messages').insert({
      thread_id: thread.id,
      role: 'assistant',
      content: 'Regenerated art',
      flyer_item_id: newItem.id,
    })
    onItemChanged(newItem)
  }

  async function handleRefinement(e: React.FormEvent) {
    e.preventDefault()
    const text = refinementInput.trim()
    if (!text || !item || refining) return

    setRefining(true)
    setRefinementError(null)

    let flyer: FlyerBrief | undefined
    if (item.text_output) {
      try {
        const parsed = JSON.parse(item.text_output) as { flyer?: FlyerBrief }
        flyer = parsed.flyer
      } catch {
        // no-op
      }
    }

    if (!flyer) {
      setRefinementError('Cannot refine: flyer brief not found')
      setRefining(false)
      return
    }

    const requestBody: FlyerGenerationRequest = {
      type: 'flyer_text',
      prompt: item.prompt,
      flyer,
      parentId: item.id,
      refinementMessage: text,
      threadId: thread.id,
    }

    const { data, error: fnError } = await supabase.functions.invoke('generate-flyer', {
      body: requestBody,
    })

    setRefining(false)

    if (fnError) {
      setRefinementError(fnError.message)
      return
    }

    const response = data as { item: ContentItem }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('messages').insert([
      {
        thread_id: thread.id,
        role: 'user',
        content: text,
        flyer_item_id: null,
      },
      {
        thread_id: thread.id,
        role: 'assistant',
        content: 'Generated updated flyer',
        flyer_item_id: response.item.id,
      },
    ])

    const now = new Date().toISOString()
    setDbMessages((prev) => [
      ...prev,
      { id: `tmp-user-${now}`, thread_id: thread.id, role: 'user', content: text, flyer_item_id: null, created_at: now },
    ])

    setRefinementInput('')
    await handleItemChanged(response.item)
  }

  const interviewMessages = dbMessages.filter((m) => m.flyer_item_id === null)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-4">
        <header>
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">
            {thread.title}
          </h2>
        </header>

        {interviewMessages.length > 0 && (
          <div className="space-y-3">
            {interviewMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-surface text-ink border border-border rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : item ? (
          <FlyerEditor
            item={item}
            threadId={thread.id}
            logoUrl={logoUrl}
            onIterated={handleItemChanged}
            onDeleted={onThreadDeleted}
          />
        ) : (
          <p className="text-sm text-ink-muted">No output yet.</p>
        )}
      </div>

      {item && !loading && (
        <div className="border-t border-border px-8 py-4 shrink-0">
          {refinementError && <p className="text-sm text-red-500 mb-2">{refinementError}</p>}
          <form onSubmit={handleRefinement} className="flex gap-2">
            <input
              value={refinementInput}
              onChange={(e) => setRefinementInput(e.target.value)}
              placeholder="Refine your flyer..."
              disabled={refining}
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!refinementInput.trim() || refining}
              className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send refinement"
            >
              {refining ? '…' : '→'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
