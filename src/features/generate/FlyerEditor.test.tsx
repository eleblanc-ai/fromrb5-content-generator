import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlyerEditor from './FlyerEditor'
import type { ContentItem } from '../../shared/config/supabase'

const mockInvoke = vi.hoisted(() => vi.fn())
const mockDeleteEq = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
const mockDelete = vi.hoisted(() => vi.fn(() => ({ eq: mockDeleteEq })))
const mockFrom = vi.hoisted(() => vi.fn(() => ({ delete: mockDelete })))

vi.mock('../../shared/config/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    from: mockFrom,
  },
}))

const mockFlyerBrief = {
  campaignGoal: 'Drive weekend tea sales',
  productName: 'Jasmine Green Reserve',
  keyDetails: 'Floral aroma, smooth finish',
  cta: 'Order now',
  tone: 'Premium and warm',
  colorVibe: 'Lavender and charcoal',
  fontVibe: 'Modern editorial sans',
  formatConstraints: 'Keep safe margins',
  format: 'instagram_post',
  renderMode: 'overlay',
}

const mockCopy = {
  headline: 'Sip the Reserve',
  tagline: 'First flush jasmine',
  body: 'A guided tasting this weekend.',
  cta: 'Order now',
}

const mockFlyerItem: ContentItem = {
  id: 'item-1',
  type: 'flyer_text',
  prompt: 'Weekend tea event flyer',
  text_output: JSON.stringify({ flyer: mockFlyerBrief, copy: mockCopy }),
  image_url: 'https://example.com/bg.png',
  parent_id: null,
  created_at: '2026-03-04T10:00:00Z',
}

describe('FlyerEditor', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockFrom.mockClear()
    mockDelete.mockClear()
    mockDeleteEq.mockReset()
    mockDeleteEq.mockResolvedValue({ error: null })
  })

  it('renders the flyer canvas area', () => {
    render(<FlyerEditor item={mockFlyerItem} />)
    expect(screen.getByTestId('flyer-canvas')).toBeInTheDocument()
  })

  it('renders the background image', () => {
    render(<FlyerEditor item={mockFlyerItem} />)
    const img = screen.getByRole('img', { name: 'Flyer background' })
    expect(img).toHaveAttribute('src', 'https://example.com/bg.png')
  })

  it('shows 4 editable text layers with correct copy', () => {
    render(<FlyerEditor item={mockFlyerItem} />)

    const headline = screen.getByLabelText('Headline') as HTMLTextAreaElement
    const tagline = screen.getByLabelText('Tagline') as HTMLTextAreaElement
    const body = screen.getByLabelText('Body') as HTMLTextAreaElement
    const cta = screen.getByLabelText('CTA') as HTMLTextAreaElement

    expect(headline.value).toBe('Sip the Reserve')
    expect(tagline.value).toBe('First flush jasmine')
    expect(body.value).toBe('A guided tasting this weekend.')
    expect(cta.value).toBe('Order now')
  })

  it('allows editing text layers', async () => {
    render(<FlyerEditor item={mockFlyerItem} />)

    const headline = screen.getByLabelText('Headline') as HTMLTextAreaElement
    await userEvent.clear(headline)
    await userEvent.type(headline, 'New Headline Text')

    expect(headline.value).toBe('New Headline Text')
  })

  it('shows Regenerate art and Download buttons', () => {
    render(<FlyerEditor item={mockFlyerItem} />)
    expect(screen.getByRole('button', { name: 'Regenerate art' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('calls generate-flyer with correct body when Regenerate art is clicked', async () => {
    const updatedItem: ContentItem = {
      ...mockFlyerItem,
      id: 'item-2',
      image_url: 'https://example.com/new-bg.png',
    }
    mockInvoke.mockResolvedValueOnce({ data: { item: updatedItem }, error: null })

    const onIterated = vi.fn()
    render(<FlyerEditor item={mockFlyerItem} threadId="thread-1" onIterated={onIterated} />)

    await userEvent.click(screen.getByRole('button', { name: 'Regenerate art' }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'generate-flyer',
        expect.objectContaining({
          body: expect.objectContaining({
            type: 'flyer_text',
            prompt: 'Weekend tea event flyer',
            flyer: expect.objectContaining({ format: 'instagram_post' }),
            parentId: 'item-1',
            threadId: 'thread-1',
          }),
        }),
      )
      expect(onIterated).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-2' }))
    })
  })

  it('shows loading state while regenerating', async () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}))

    render(<FlyerEditor item={mockFlyerItem} />)

    await userEvent.click(screen.getByRole('button', { name: 'Regenerate art' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generating...' })).toBeDisabled()
    })
  })

  it('shows an error when regenerate fails', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Gemini unavailable' } })

    render(<FlyerEditor item={mockFlyerItem} />)

    await userEvent.click(screen.getByRole('button', { name: 'Regenerate art' }))

    await waitFor(() => {
      expect(screen.getByText('Gemini unavailable')).toBeInTheDocument()
    })
  })

  it('shows a delete button', () => {
    render(<FlyerEditor item={mockFlyerItem} />)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('calls supabase delete and onDeleted when Delete is clicked', async () => {
    const onDeleted = vi.fn()
    render(<FlyerEditor item={mockFlyerItem} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('content_items')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'item-1')
      expect(onDeleted).toHaveBeenCalled()
    })
  })

  it('shows fallback when item has no flyer data', () => {
    const emptyItem: ContentItem = {
      ...mockFlyerItem,
      text_output: null,
    }
    render(<FlyerEditor item={emptyItem} />)
    expect(screen.getByText('No flyer data available.')).toBeInTheDocument()
  })

  it('applies larger font size to headline than body', () => {
    render(<FlyerEditor item={mockFlyerItem} />)

    const headline = screen.getByLabelText('Headline') as HTMLTextAreaElement
    const body = screen.getByLabelText('Body') as HTMLTextAreaElement

    const headlineSize = parseFloat(headline.style.fontSize)
    const bodySize = parseFloat(body.style.fontSize)

    expect(headlineSize).toBeGreaterThan(bodySize)
  })

  it('applies the correct font family for editorial fontVibe', () => {
    render(<FlyerEditor item={mockFlyerItem} />)

    const headline = screen.getByLabelText('Headline') as HTMLTextAreaElement
    expect(headline.style.fontFamily).toContain('Playfair Display')
  })

  it('shows the scrim toggle button', () => {
    render(<FlyerEditor item={mockFlyerItem} />)
    expect(screen.getByRole('button', { name: 'Toggle scrim' })).toBeInTheDocument()
  })

  it('scrim is on by default and shows filled indicator', () => {
    render(<FlyerEditor item={mockFlyerItem} />)
    expect(screen.getByRole('button', { name: 'Toggle scrim' })).toHaveTextContent('Scrim ●')
  })

  it('toggling scrim off changes label and removes background from layers', async () => {
    render(<FlyerEditor item={mockFlyerItem} />)

    const toggle = screen.getByRole('button', { name: 'Toggle scrim' })
    const headline = screen.getByLabelText('Headline') as HTMLTextAreaElement
    const wrapper = headline.closest('.absolute') as HTMLElement

    expect(wrapper).toHaveStyle({ background: 'rgba(0,0,0,0.35)' })

    await userEvent.click(toggle)

    expect(toggle).toHaveTextContent('Scrim ○')
    expect(wrapper).not.toHaveStyle({ background: 'rgba(0,0,0,0.35)' })
  })

  it('textarea height matches its font size', () => {
    render(<FlyerEditor item={mockFlyerItem} />)
    const headline = screen.getByLabelText('Headline') as HTMLTextAreaElement
    expect(headline.style.height).toBeTruthy()
    expect(headline.style.height).toBe(headline.style.fontSize)
  })
})
