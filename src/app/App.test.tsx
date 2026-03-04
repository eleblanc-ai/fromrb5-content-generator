import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import type { Thread, ContentItem, Message } from '../shared/config/supabase'

// ---- Mock supabase with chainable query builders ----

const mockThreadsOrder = vi.hoisted(() => vi.fn())
const mockMessagesLimit = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: [], error: null }),
)
const mockMessagesAllOrder = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: [], error: null }),
)
const mockItemSingle = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: null, error: null }),
)

vi.mock('../shared/config/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'threads') {
        return { select: () => ({ order: mockThreadsOrder }) }
      }
      if (table === 'messages') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({ limit: mockMessagesLimit }),
              }),
              order: mockMessagesAllOrder,
            }),
          }),
        }
      }
      if (table === 'content_items') {
        return {
          select: () => ({
            eq: () => ({ single: mockItemSingle }),
          }),
        }
      }
      return {}
    },
  },
}))

// ---- Fixtures ----

const mockThread: Thread = {
  id: 'thread-1',
  title: 'Drive weekend tea tasting signups',
  format: 'instagram_post',
  render_mode: 'ai_composed',
  created_at: '2026-03-03T10:00:00Z',
}

const generatedThread: Thread = {
  id: 'new-thread',
  title: 'Drive weekend tea tasting signups',
  format: 'instagram_post',
  render_mode: 'ai_composed',
  created_at: '2026-03-03T11:00:00Z',
}

const generatedItem: ContentItem = {
  id: 'generated-item',
  type: 'flyer_text',
  prompt: 'Fresh generated item',
  text_output: null,
  image_url: null,
  parent_id: null,
  created_at: '2026-03-03T11:00:00Z',
}

// ---- Feature mocks ----

vi.mock('../features/generate', () => ({
  GenerateForm: ({
    onResult,
  }: {
    onResult: (thread: Thread, item: ContentItem) => void
    onThreadStarted: (thread: Thread) => void
    resumeThread?: Thread
    resumeMessages?: Message[]
  }) => (
    <button onClick={() => onResult(generatedThread, generatedItem)}>Generate</button>
  ),
}))

vi.mock('../features/threads', () => ({
  ThreadSidebar: ({
    threads,
    activeThreadId,
    onNewThread,
    onSelect,
  }: {
    threads: Thread[]
    activeThreadId: string | null
    onNewThread: () => void
    onSelect: (thread: Thread) => void
  }) => (
    <nav aria-label="Flyer threads">
      <button onClick={onNewThread}>New flyer</button>
      {threads.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t)}
          aria-current={activeThreadId === t.id ? 'true' : undefined}
        >
          {t.title}
        </button>
      ))}
    </nav>
  ),
  ThreadView: ({
    thread,
    onThreadDeleted,
  }: {
    thread: Thread
    onThreadDeleted: () => void
  }) => (
    <div data-testid="thread-view">
      <span>{thread.title}</span>
      <button onClick={onThreadDeleted}>Delete thread</button>
    </div>
  ),
}))

describe('App', () => {
  beforeEach(() => {
    mockThreadsOrder.mockReset()
    mockMessagesLimit.mockReset()
    mockMessagesLimit.mockResolvedValue({ data: [], error: null })
    mockMessagesAllOrder.mockReset()
    mockMessagesAllOrder.mockResolvedValue({ data: [], error: null })
    mockItemSingle.mockReset()
    mockItemSingle.mockResolvedValue({ data: null, error: null })
  })

  it('renders the app shell with header and sidebar', async () => {
    mockThreadsOrder.mockResolvedValue({ data: [], error: null })
    render(<App />)
    expect(screen.getByText('Content Studio')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Flyer threads' })).toBeInTheDocument()
  })

  it('shows generate form when there are no threads', async () => {
    mockThreadsOrder.mockResolvedValue({ data: [], error: null })
    render(<App />)

    await waitFor(() => {
      expect(mockThreadsOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
    })
  })

  it('loads threads on mount and shows them in sidebar', async () => {
    mockThreadsOrder.mockResolvedValue({
      data: [
        { ...mockThread, id: 'thread-1', title: 'Thread one' },
        { ...mockThread, id: 'thread-2', title: 'Thread two' },
      ],
      error: null,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thread one' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Thread two' })).toBeInTheDocument()
    })
  })

  it('shows generate form when new flyer button is clicked', async () => {
    mockThreadsOrder.mockResolvedValue({
      data: [mockThread],
      error: null,
    })

    render(<App />)
    await screen.findByRole('button', { name: mockThread.title })

    await userEvent.click(screen.getByRole('button', { name: 'New flyer' }))

    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
    expect(screen.queryByTestId('thread-view')).not.toBeInTheDocument()
  })

  it('adds a new thread to the sidebar and shows thread view when generation completes', async () => {
    mockThreadsOrder.mockResolvedValue({ data: [], error: null })
    render(<App />)

    await waitFor(() => expect(mockThreadsOrder).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: generatedThread.title })).toBeInTheDocument()
      expect(screen.getByTestId('thread-view')).toBeInTheDocument()
    })
  })

  it('removes thread from sidebar when onThreadDeleted fires', async () => {
    mockThreadsOrder.mockResolvedValue({
      data: [
        { ...mockThread, id: 'thread-1', title: 'Thread to delete' },
        { ...mockThread, id: 'thread-2', title: 'Thread to keep' },
      ],
      error: null,
    })
    // thread-1 is a completed thread so ThreadView renders with Delete button
    mockMessagesLimit.mockResolvedValue({
      data: [{ id: 'msg-1', thread_id: 'thread-1', role: 'assistant', content: 'done', flyer_item_id: 'item-1', created_at: '2026-03-03T11:00:00Z' }],
      error: null,
    })
    mockItemSingle.mockResolvedValue({ data: generatedItem, error: null })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thread to delete' })).toBeInTheDocument()
    })

    const deleteButton = await screen.findByRole('button', { name: 'Delete thread' })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Thread to delete' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Thread to keep' })).toBeInTheDocument()
    })
  })

  it('shows GenerateForm when clicking an in-progress thread with no flyer', async () => {
    mockThreadsOrder.mockResolvedValue({
      data: [{ ...mockThread, id: 'thread-1', title: 'In progress thread' }],
      error: null,
    })
    // No flyer_item_id — in-progress thread
    mockMessagesLimit.mockResolvedValue({
      data: [{ id: 'msg-1', thread_id: 'thread-1', role: 'assistant', content: 'What product?', flyer_item_id: null, created_at: '2026-03-03T10:00:00Z' }],
      error: null,
    })
    mockMessagesAllOrder.mockResolvedValue({
      data: [
        { id: 'msg-1', thread_id: 'thread-1', role: 'assistant', content: 'What product?', flyer_item_id: null, created_at: '2026-03-03T10:00:00Z' },
        { id: 'msg-2', thread_id: 'thread-1', role: 'user', content: 'Jasmine tea', flyer_item_id: null, created_at: '2026-03-03T10:01:00Z' },
      ],
      error: null,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
      expect(screen.queryByTestId('thread-view')).not.toBeInTheDocument()
    })
  })
})
