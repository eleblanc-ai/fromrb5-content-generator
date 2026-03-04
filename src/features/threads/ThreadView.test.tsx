import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreadView from './ThreadView'
import type { ContentItem, Message, Thread } from '../../shared/config/supabase'

const mockInvoke = vi.hoisted(() => vi.fn())
const mockMessagesOrder = vi.hoisted(() => vi.fn().mockResolvedValue({ data: [], error: null }))
const mockMessageInsert = vi.hoisted(() => vi.fn().mockResolvedValue({ data: null, error: null }))
const mockThreadsUpdateEq = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
const mockThreadsUpdate = vi.hoisted(() => vi.fn(() => ({ eq: mockThreadsUpdateEq })))

vi.mock('../../shared/config/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'messages') {
        return {
          select: () => ({
            eq: () => ({
              order: mockMessagesOrder,
            }),
          }),
          insert: mockMessageInsert,
        }
      }
      if (table === 'threads') {
        return { update: mockThreadsUpdate }
      }
      return {}
    },
    functions: {
      invoke: mockInvoke,
    },
  },
}))

vi.mock('../generate', () => ({
  FlyerEditor: ({
    item,
    onIterated,
    onDeleted,
  }: {
    item: ContentItem
    onIterated?: (item: ContentItem) => void
    onDeleted?: () => void
  }) => (
    <div data-testid="flyer-editor">
      <span data-testid="result-id">{item.id}</span>
      <button onClick={() => onIterated?.({ ...item, id: 'item-iterated' })}>Iterate</button>
      <button onClick={onDeleted}>Delete thread</button>
    </div>
  ),
}))

const mockThread: Thread = {
  id: 'thread-1',
  title: 'Drive weekend tea sales',
  format: 'instagram_post',
  render_mode: 'ai_composed',
  created_at: '2026-03-03T10:00:00Z',
}

const mockFlyerBrief = {
  campaignGoal: 'Drive weekend tea sales',
  productName: 'Jasmine Green Reserve',
  keyDetails: 'First flush, floral aroma',
  cta: 'Order today',
  tone: 'Premium and warm',
  colorVibe: 'Lavender and charcoal',
  fontVibe: 'Modern editorial sans',
  formatConstraints: 'Keep safe margins',
  format: 'instagram_post',
  renderMode: 'ai_composed',
}

const mockFlyerItem: ContentItem = {
  id: 'item-1',
  type: 'flyer_text',
  prompt: 'Campaign goal: Drive weekend tea sales',
  text_output: JSON.stringify({ flyer: mockFlyerBrief }),
  image_url: null,
  parent_id: null,
  created_at: '2026-03-03T10:00:00Z',
}

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    thread_id: 'thread-1',
    role: 'assistant',
    content: 'What product are we making this flyer for?',
    flyer_item_id: null,
    created_at: '2026-03-03T10:00:01Z',
  },
  {
    id: 'msg-2',
    thread_id: 'thread-1',
    role: 'user',
    content: 'Jasmine Green Reserve',
    flyer_item_id: null,
    created_at: '2026-03-03T10:00:02Z',
  },
]

describe('ThreadView', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockMessagesOrder.mockReset()
    mockMessageInsert.mockReset()
    mockThreadsUpdate.mockClear()
    mockThreadsUpdateEq.mockReset()
    mockMessagesOrder.mockResolvedValue({ data: [], error: null })
    mockMessageInsert.mockResolvedValue({ data: null, error: null })
    mockThreadsUpdateEq.mockResolvedValue({ error: null })
  })

  it('loads and displays interview message history', async () => {
    mockMessagesOrder.mockResolvedValue({ data: mockMessages, error: null })

    render(
      <ThreadView
        thread={mockThread}
        item={null}
        loading={false}
        onItemChanged={() => {}}
        onThreadDeleted={() => {}}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('What product are we making this flyer for?')).toBeInTheDocument()
      expect(screen.getByText('Jasmine Green Reserve')).toBeInTheDocument()
    })
  })

  it('shows refinement input when item is present', async () => {
    mockMessagesOrder.mockResolvedValue({ data: [], error: null })

    render(
      <ThreadView
        thread={mockThread}
        item={mockFlyerItem}
        loading={false}
        onItemChanged={() => {}}
        onThreadDeleted={() => {}}
      />,
    )

    expect(screen.getByPlaceholderText('Refine your flyer...')).toBeInTheDocument()
  })

  it('hides refinement input when item is null', async () => {
    mockMessagesOrder.mockResolvedValue({ data: [], error: null })

    render(
      <ThreadView
        thread={mockThread}
        item={null}
        loading={false}
        onItemChanged={() => {}}
        onThreadDeleted={() => {}}
      />,
    )

    expect(screen.queryByPlaceholderText('Refine your flyer...')).not.toBeInTheDocument()
  })

  it('submits refinement and calls onItemChanged with new item', async () => {
    mockMessagesOrder.mockResolvedValue({ data: [], error: null })

    const updatedItem: ContentItem = { ...mockFlyerItem, id: 'item-2' }
    mockInvoke.mockResolvedValueOnce({ data: { item: updatedItem }, error: null })

    const onItemChanged = vi.fn()

    render(
      <ThreadView
        thread={mockThread}
        item={mockFlyerItem}
        loading={false}
        onItemChanged={onItemChanged}
        onThreadDeleted={() => {}}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText('Refine your flyer...'), 'Make it more minimal')
    await userEvent.click(screen.getByRole('button', { name: 'Send refinement' }))

    await waitFor(() => {
      expect(onItemChanged).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-2' }))
    })

    expect(mockInvoke).toHaveBeenCalledWith(
      'generate-flyer',
      expect.objectContaining({
        body: expect.objectContaining({
          refinementMessage: 'Make it more minimal',
          parentId: 'item-1',
        }),
      }),
    )

    expect(mockMessageInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Make it more minimal', flyer_item_id: null }),
      ]),
    )
  })

  it('shows generating state while refinement is in progress', async () => {
    mockMessagesOrder.mockResolvedValue({ data: [], error: null })
    mockInvoke.mockImplementation(() => new Promise(() => {}))

    render(
      <ThreadView
        thread={mockThread}
        item={mockFlyerItem}
        loading={false}
        onItemChanged={() => {}}
        onThreadDeleted={() => {}}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText('Refine your flyer...'), 'Make it more colorful')
    await userEvent.click(screen.getByRole('button', { name: 'Send refinement' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send refinement' })).toBeDisabled()
      expect(screen.getByPlaceholderText('Refine your flyer...')).toBeDisabled()
    })
  })

  it('updates thread flyer_item_id when FlyerEditor iterates', async () => {
    render(
      <ThreadView
        thread={mockThread}
        item={mockFlyerItem}
        loading={false}
        onItemChanged={vi.fn()}
        onThreadDeleted={() => {}}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Iterate' }))

    await waitFor(() => {
      expect(mockThreadsUpdate).toHaveBeenCalledWith({ flyer_item_id: 'item-iterated' })
      expect(mockThreadsUpdateEq).toHaveBeenCalledWith('id', 'thread-1')
    })
  })
})
