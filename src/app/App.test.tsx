import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const mockOrder = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn(() => ({ order: mockOrder })))
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })))

const generatedItem = {
  id: 'generated-item',
  type: 'tea_writeup' as const,
  prompt: 'Fresh generated item',
  text_output: 'Generated content',
  image_url: null,
  parent_id: null,
  created_at: '2026-03-01T11:00:00Z',
}

vi.mock('../features/generate', () => ({
  GenerateForm: ({ onResult }: { onResult: (item: typeof generatedItem) => void }) => (
    <button onClick={() => onResult(generatedItem)}>Generate</button>
  ),
  ResultCard: ({ item }: { item: { id: string; prompt: string } }) => (
    <article data-testid="result-card">{item.prompt}</article>
  ),
}))

vi.mock('../shared/config/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

describe('App', () => {
  beforeEach(() => {
    mockOrder.mockReset()
    mockSelect.mockClear()
    mockFrom.mockClear()
  })

  it('renders the app shell', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    render(<App />)
    expect(screen.getByText('Content Studio')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items')
    })
  })

  it('loads and renders existing history items', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'history-1',
          type: 'tea_writeup',
          prompt: 'History item 1',
          text_output: 'Text 1',
          image_url: null,
          parent_id: null,
          created_at: '2026-03-01T10:00:00Z',
        },
        {
          id: 'history-2',
          type: 'image',
          prompt: 'History item 2',
          text_output: null,
          image_url: 'https://example.com/image.png',
          parent_id: null,
          created_at: '2026-03-01T09:00:00Z',
        },
      ],
      error: null,
    })

    render(<App />)

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    const cards = await screen.findAllByTestId('result-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('History item 1')
    expect(cards[1]).toHaveTextContent('History item 2')
  })

  it('prepends newly generated items to history', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'history-1',
          type: 'tea_writeup',
          prompt: 'Older history item',
          text_output: 'Text 1',
          image_url: null,
          parent_id: null,
          created_at: '2026-03-01T10:00:00Z',
        },
      ],
      error: null,
    })

    render(<App />)

    await screen.findByText('Older history item')
    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    const cards = await screen.findAllByTestId('result-card')
    expect(cards[0]).toHaveTextContent('Fresh generated item')
    expect(cards[1]).toHaveTextContent('Older history item')
  })

  it('renders the generate form', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    render(<App />)
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items')
    })
  })
})
