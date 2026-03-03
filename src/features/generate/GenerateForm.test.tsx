import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GenerateForm from './GenerateForm'
import type { Thread } from '../../shared/config/supabase'

const mockInvoke = vi.hoisted(() => vi.fn())
const mockThreadSingle = vi.hoisted(() => vi.fn())
const mockMessageInsert = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: null, error: null }),
)

const mockThread: Thread = {
  id: 'thread-123',
  title: 'Boost weekend sales',
  format: 'instagram_post',
  render_mode: 'ai_composed',
  created_at: '2026-03-03T00:00:00Z',
}

vi.mock('../../shared/config/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    from: (table: string) => {
      if (table === 'threads') {
        return {
          insert: () => ({
            select: () => ({
              single: mockThreadSingle,
            }),
          }),
        }
      }
      if (table === 'messages') {
        return { insert: mockMessageInsert }
      }
      return {}
    },
  },
}))

const mockFlyerItem = {
  id: 'item-1',
  type: 'flyer_text' as const,
  prompt: 'Campaign goal: Boost weekend sales',
  text_output: JSON.stringify({ flyer: { format: 'instagram_post' } }),
  image_url: 'https://example.com/flyer.png',
  parent_id: null,
  created_at: '2026-03-03T00:00:00Z',
}

const mockBrief = {
  productName: 'Jasmine Green Reserve',
  campaignGoal: 'Boost weekend sales',
  keyDetails: 'First flush, floral aroma',
  cta: 'Order today',
  tone: 'Premium and warm',
  colorVibe: 'Lavender and charcoal',
  fontVibe: 'Modern editorial sans',
  formatConstraints: 'Keep safe margins',
  format: 'instagram_post' as const,
  renderMode: 'ai_composed' as const,
}

describe('GenerateForm', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockThreadSingle.mockReset()
    mockMessageInsert.mockReset()
    mockMessageInsert.mockResolvedValue({ data: null, error: null })
    mockThreadSingle.mockResolvedValue({ data: mockThread, error: null })
  })

  it('shows loading state while interview is starting', () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}))
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByText('Starting interview...')).toBeInTheDocument()
  })

  it('renders opening question after interview starts', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { message: 'What product are we making this flyer for?', complete: false },
      error: null,
    })
    render(<GenerateForm onResult={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText('What product are we making this flyer for?')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('Type your answer...')).toBeInTheDocument()
  })

  it('shows next question after user submits an answer', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        data: { message: 'What product are we making this flyer for?', complete: false },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { message: "What's the campaign goal?", complete: false },
        error: null,
      })

    render(<GenerateForm onResult={() => {}} />)
    await waitFor(() => screen.getByPlaceholderText('Type your answer...'))

    await userEvent.type(screen.getByPlaceholderText('Type your answer...'), 'Jasmine Green Reserve')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(screen.getByText('Jasmine Green Reserve')).toBeInTheDocument()
      expect(screen.getByText("What's the campaign goal?")).toBeInTheDocument()
    })
  })

  it('auto-generates and fires onResult when interview completes', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        data: { message: 'What product are we making this flyer for?', complete: false },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          message: 'Perfect, I have everything I need — generating your flyer now!',
          complete: true,
          brief: mockBrief,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          item: mockFlyerItem,
          variants: [{ id: 'v1', prompt: 'Variant', image_url: 'https://example.com/v1.png' }],
        },
        error: null,
      })

    const onResult = vi.fn()
    render(<GenerateForm onResult={onResult} />)
    await waitFor(() => screen.getByPlaceholderText('Type your answer...'))

    await userEvent.type(screen.getByPlaceholderText('Type your answer...'), 'Jasmine Green Reserve')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'thread-123' }),
        expect.objectContaining({ id: 'item-1' }),
      )
    })

    expect(mockInvoke).toHaveBeenCalledWith(
      'generate-flyer',
      expect.objectContaining({
        body: expect.objectContaining({
          type: 'flyer_text',
          flyer: expect.objectContaining({
            productName: 'Jasmine Green Reserve',
            campaignGoal: 'Boost weekend sales',
            format: 'instagram_post',
            renderMode: 'ai_composed',
          }),
        }),
      }),
    )
  })

  it('shows generating state while flyer is being created', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        data: { message: 'What product are we making this flyer for?', complete: false },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          message: 'Generating!',
          complete: true,
          brief: mockBrief,
        },
        error: null,
      })
      .mockImplementationOnce(() => new Promise(() => {})) // generate-flyer never resolves

    render(<GenerateForm onResult={() => {}} />)
    await waitFor(() => screen.getByPlaceholderText('Type your answer...'))

    await userEvent.type(screen.getByPlaceholderText('Type your answer...'), 'Jasmine Green Reserve')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(screen.getByText('Generating your flyer...')).toBeInTheDocument()
    })
  })

  it('shows error message when interview call fails', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        data: { message: 'What product are we making this flyer for?', complete: false },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'API call failed' },
      })

    render(<GenerateForm onResult={() => {}} />)
    await waitFor(() => screen.getByPlaceholderText('Type your answer...'))

    await userEvent.type(screen.getByPlaceholderText('Type your answer...'), 'Jasmine Green Reserve')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(screen.getByText('API call failed')).toBeInTheDocument()
    })
  })
})
