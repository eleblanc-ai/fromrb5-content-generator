import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultCard from './ResultCard'
import type { ContentItem } from '../../shared/config/supabase'

const mockInvoke = vi.hoisted(() => vi.fn())
const mockDeleteIn = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
const mockDelete = vi.hoisted(() => vi.fn(() => ({ in: mockDeleteIn })))
const mockFrom = vi.hoisted(() => vi.fn(() => ({ delete: mockDelete })))

vi.mock('../../shared/config/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    from: mockFrom,
  },
}))

const mockTextItem: ContentItem = {
  id: '123',
  type: 'tea_writeup',
  prompt: 'Write about green tea',
  text_output: 'A delicate green tea with vegetal notes and a clean finish.',
  image_url: null,
  parent_id: null,
  created_at: '2026-02-22T00:00:00Z',
}

const mockImageItem: ContentItem = {
  id: '456',
  type: 'image',
  prompt: 'A tin of green tea on a wooden table',
  text_output: null,
  image_url: 'https://example.com/generated.png',
  parent_id: null,
  created_at: '2026-02-22T00:00:00Z',
}

const mockFlyerImageItem: ContentItem = {
  id: '999',
  type: 'flyer_text',
  prompt: 'Weekend tea event flyer',
  text_output: JSON.stringify({
    flyer: {
      campaignGoal: 'Drive event signups',
      productName: 'Jasmine Green Reserve',
      keyDetails: 'Floral aroma, smooth finish',
      cta: 'RSVP today',
      tone: 'Calm premium',
      colorVibe: 'Lavender charcoal',
      fontVibe: 'Editorial sans',
      formatConstraints: 'Keep top safe area clear',
      format: 'instagram_post',
      renderMode: 'ai_composed',
    },
    variants: [
      { id: 'v1', prompt: 'Variant 1', image_url: 'https://example.com/flyer-v1.png' },
    ],
    copy: {
      headline: 'Sip the Reserve',
      tagline: 'First flush jasmine, this weekend only',
      body: 'Join us for a guided tasting of our most prized harvest.',
      cta: 'RSVP today',
    },
  }),
  image_url: 'https://example.com/flyer.png',
  parent_id: null,
  created_at: '2026-03-01T00:00:00Z',
}

const mockFlyerOverlayItem: ContentItem = {
  id: '888',
  type: 'flyer_text',
  prompt: 'Overlay mode flyer',
  text_output: JSON.stringify({
    flyer: {
      campaignGoal: 'Drive event signups',
      productName: 'Jasmine Green Reserve',
      keyDetails: 'Floral aroma, smooth finish',
      cta: 'RSVP today',
      tone: 'Calm premium',
      colorVibe: 'Lavender charcoal',
      fontVibe: 'Editorial sans',
      formatConstraints: 'Keep top safe area clear',
      format: 'instagram_post',
      renderMode: 'overlay',
    },
    variants: [
      { id: 'ov1', prompt: 'Overlay Variant 1', image_url: 'https://example.com/bg-v1.png' },
    ],
    copy: {
      headline: 'Sip the Reserve',
      tagline: 'First flush jasmine, this weekend only',
      body: 'Join us for a guided tasting of our most prized harvest.',
      cta: 'RSVP today',
    },
  }),
  image_url: 'https://example.com/bg-primary.png',
  parent_id: null,
  created_at: '2026-03-02T00:00:00Z',
}

describe('ResultCard', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockFrom.mockClear()
    mockDelete.mockClear()
    mockDeleteIn.mockReset()
    mockDeleteIn.mockResolvedValue({ error: null })

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the content type label', () => {
    render(<ResultCard item={mockTextItem} />)
    expect(screen.getByText('Tea writeup')).toBeInTheDocument()
  })

  it('renders the prompt', () => {
    render(<ResultCard item={mockTextItem} />)
    expect(screen.getByText('Write about green tea')).toBeInTheDocument()
  })

  it('renders text output for text items', () => {
    render(<ResultCard item={mockTextItem} />)
    expect(
      screen.getByText('A delicate green tea with vegetal notes and a clean finish.'),
    ).toBeInTheDocument()
  })

  it('renders an image for image items', () => {
    render(<ResultCard item={mockImageItem} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/generated.png')
    expect(img).toHaveAttribute('alt', 'A tin of green tea on a wooden table')
  })

  it('does not render an image for text items', () => {
    render(<ResultCard item={mockTextItem} />)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows a copy action for text items only', () => {
    const { rerender } = render(<ResultCard item={mockTextItem} />)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Iterate image' })).toBeNull()

    rerender(<ResultCard item={mockImageItem} />)
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iterate image' })).toBeInTheDocument()

    rerender(<ResultCard item={mockFlyerImageItem} />)
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iterate image' })).toBeNull()
  })

  it('copies text output when copy is clicked', async () => {
    render(<ResultCard item={mockTextItem} />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'A delicate green tea with vegetal notes and a clean finish.',
    )
  })

  it('creates and clicks a download link for image items', async () => {
    const originalCreateElement = document.createElement.bind(document)
    const anchor = originalCreateElement('a')
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {})

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return anchor
      }

      return originalCreateElement(tagName)
    }) as typeof document.createElement)

    render(<ResultCard item={mockImageItem} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download' }))

    expect(anchor.href).toContain('https://example.com/generated.png')
    expect(anchor.download).toBe('image-456.png')
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('iterates an image with parentId and returns the new item', async () => {
    const iteratedItem: ContentItem = {
      id: '789',
      type: 'image',
      prompt: 'Make the light warmer',
      text_output: null,
      image_url: 'https://example.com/iterated.png',
      parent_id: '456',
      created_at: '2026-03-01T13:00:00Z',
    }

    mockInvoke.mockResolvedValue({ data: { item: iteratedItem }, error: null })

    const onIterated = vi.fn()
    render(<ResultCard item={mockImageItem} onIterated={onIterated} />)

    await userEvent.type(
      screen.getByPlaceholderText('Describe how to refine this image...'),
      'Make the light warmer',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Iterate image' }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate-image', {
        body: {
          prompt: 'Make the light warmer',
          type: 'image',
          parentId: '456',
          sourceImageUrl: 'https://example.com/generated.png',
        },
      })
      expect(onIterated).toHaveBeenCalledWith(iteratedItem)
    })
  })

  it('regenerates using selected flyer variant context', async () => {
    const regeneratedItem: ContentItem = {
      id: 'new-item',
      type: 'flyer_text',
      prompt: 'Weekend tea event flyer',
      text_output: JSON.stringify({ flyer: { format: 'instagram_post' } }),
      image_url: 'https://example.com/new-primary.png',
      parent_id: 'v3',
      created_at: '2026-03-01T15:00:00Z',
    }

    mockInvoke.mockResolvedValue({
      data: {
        item: regeneratedItem,
        variants: [
          { id: 'nv1', prompt: 'New Variant 1', image_url: 'https://example.com/nv1.png' },
        ],
      },
      error: null,
    })

    const onIterated = vi.fn()
    render(<ResultCard item={mockFlyerImageItem} onIterated={onIterated} />)

    await userEvent.click(screen.getByRole('button', { name: 'Regenerate selected variant' }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate-flyer', {
        body: {
          type: 'flyer_text',
          prompt: 'Weekend tea event flyer',
          flyer: {
            campaignGoal: 'Drive event signups',
            productName: 'Jasmine Green Reserve',
            keyDetails: 'Floral aroma, smooth finish',
            cta: 'RSVP today',
            tone: 'Calm premium',
            colorVibe: 'Lavender charcoal',
            fontVibe: 'Editorial sans',
            formatConstraints: 'Keep top safe area clear',
            format: 'instagram_post',
            renderMode: 'ai_composed',
          },
          parentId: 'v1',
          sourceImageUrl: 'https://example.com/flyer-v1.png',
        },
      })
      expect(onIterated).toHaveBeenCalled()
    })
  })

  it('does not render a download all variants button', () => {
    render(<ResultCard item={mockImageItem} />)
    expect(screen.queryByRole('button', { name: 'Download all variants' })).toBeNull()
  })

  it('renders editable copy fields for flyer cards with copy block', () => {
    render(<ResultCard item={mockFlyerImageItem} />)
    expect(screen.getByLabelText('Headline')).toHaveValue('Sip the Reserve')
    expect(screen.getByLabelText('Tagline')).toHaveValue('First flush jasmine, this weekend only')
    expect(screen.getByLabelText('Body')).toHaveValue(
      'Join us for a guided tasting of our most prized harvest.',
    )
    expect(screen.getByLabelText('CTA')).toHaveValue('RSVP today')
    expect(screen.getByRole('button', { name: 'Re-render with edits' })).toBeInTheDocument()
  })

  it('invokes generate-flyer with copyOverride when re-render with edits is clicked', async () => {
    const rerenderItem: ContentItem = {
      id: 'rerender-1',
      type: 'flyer_text',
      prompt: 'Weekend tea event flyer',
      text_output: JSON.stringify({ flyer: { format: 'instagram_post' }, copy: { headline: 'New Headline', tagline: 'New Tagline', body: 'New Body', cta: 'New CTA' } }),
      image_url: 'https://example.com/rerendered.png',
      parent_id: 'v1',
      created_at: '2026-03-02T00:00:00Z',
    }

    mockInvoke.mockResolvedValue({
      data: { item: rerenderItem, variants: [] },
      error: null,
    })

    const onIterated = vi.fn()
    render(<ResultCard item={mockFlyerImageItem} onIterated={onIterated} />)

    const headlineInput = screen.getByLabelText('Headline')
    await userEvent.clear(headlineInput)
    await userEvent.type(headlineInput, 'Updated Headline')

    await userEvent.click(screen.getByRole('button', { name: 'Re-render with edits' }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'generate-flyer',
        expect.objectContaining({
          body: expect.objectContaining({
            type: 'flyer_text',
            copyOverride: expect.objectContaining({ headline: 'Updated Headline' }),
          }),
        }),
      )
      expect(onIterated).toHaveBeenCalled()
    })
  })

  it('shows a delete button on all card types', () => {
    const { rerender } = render(<ResultCard item={mockTextItem} />)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()

    rerender(<ResultCard item={mockImageItem} />)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()

    rerender(<ResultCard item={mockFlyerImageItem} />)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('deletes all variant rows when delete is clicked on a flyer card', async () => {
    const onDeleted = vi.fn()
    render(<ResultCard item={mockFlyerImageItem} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockDeleteIn).toHaveBeenCalledWith(
        'id',
        expect.arrayContaining(['999', 'v1']),
      )
      expect(onDeleted).toHaveBeenCalled()
    })
  })

  it('deletes single item when delete is clicked on a non-flyer card', async () => {
    const onDeleted = vi.fn()
    render(<ResultCard item={mockTextItem} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockDeleteIn).toHaveBeenCalledWith('id', ['123'])
      expect(onDeleted).toHaveBeenCalled()
    })
  })

  it('renders canvas elements for overlay-mode flyer cards', () => {
    render(<ResultCard item={mockFlyerOverlayItem} />)
    const canvases = document.querySelectorAll('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1)
  })
})
