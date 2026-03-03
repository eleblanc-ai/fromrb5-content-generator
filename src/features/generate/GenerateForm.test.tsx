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

async function answerAllTextQuestions() {
  const answers = [
    'Jasmine Green Reserve',
    'Boost weekend sales',
    'First flush, floral aroma',
    'Order today',
    'Premium and warm',
    'Lavender and charcoal',
    'Modern editorial sans',
    'Keep safe margins',
  ]
  for (const answer of answers) {
    await userEvent.type(screen.getByPlaceholderText('Type your answer...'), answer)
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
  }
}

describe('GenerateForm', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockThreadSingle.mockReset()
    mockMessageInsert.mockReset()
    mockMessageInsert.mockResolvedValue({ data: null, error: null })
    mockThreadSingle.mockResolvedValue({ data: mockThread, error: null })
  })

  it('renders the opening interview question', () => {
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByText('What product are we making this flyer for?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your answer...')).toBeInTheDocument()
  })

  it('advances to next question after user submits an answer', async () => {
    render(<GenerateForm onResult={() => {}} />)

    await userEvent.type(screen.getByPlaceholderText('Type your answer...'), 'Jasmine Green Reserve')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByText('Jasmine Green Reserve')).toBeInTheDocument()
    expect(
      screen.getByText("What's the campaign goal — what should this flyer achieve?"),
    ).toBeInTheDocument()
  })

  it('shows format button choices after all text questions are answered', async () => {
    render(<GenerateForm onResult={() => {}} />)

    await answerAllTextQuestions()

    expect(screen.getByRole('button', { name: 'Instagram Post' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Instagram Story' })).toBeInTheDocument()
  })

  it('shows render mode button choices after format is selected', async () => {
    render(<GenerateForm onResult={() => {}} />)

    await answerAllTextQuestions()
    await userEvent.click(screen.getByRole('button', { name: 'Instagram Post' }))

    expect(screen.getByRole('button', { name: 'AI composed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Overlay' })).toBeInTheDocument()
  })

  it('auto-generates after render mode is selected and fires onResult', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        item: mockFlyerItem,
        variants: [{ id: 'v1', prompt: 'Variant', image_url: 'https://example.com/v1.png' }],
      },
      error: null,
    })
    const onResult = vi.fn()
    render(<GenerateForm onResult={onResult} />)

    await answerAllTextQuestions()
    await userEvent.click(screen.getByRole('button', { name: 'Instagram Post' }))
    await userEvent.click(screen.getByRole('button', { name: 'AI composed' }))

    await waitFor(() => {
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
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'thread-123' }),
        expect.objectContaining({ id: 'item-1' }),
      )
    })
  })

  it('shows generating state while pending', async () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}))
    render(<GenerateForm onResult={() => {}} />)

    await answerAllTextQuestions()
    await userEvent.click(screen.getByRole('button', { name: 'Instagram Post' }))
    await userEvent.click(screen.getByRole('button', { name: 'AI composed' }))

    expect(screen.getByText('Generating your flyer...')).toBeInTheDocument()
  })

  it('shows error message on generation failure', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'API call failed' } })
    render(<GenerateForm onResult={() => {}} />)

    await answerAllTextQuestions()
    await userEvent.click(screen.getByRole('button', { name: 'Instagram Post' }))
    await userEvent.click(screen.getByRole('button', { name: 'AI composed' }))

    await waitFor(() => {
      expect(screen.getByText('API call failed')).toBeInTheDocument()
    })
  })
})
