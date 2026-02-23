import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultCard from './ResultCard'
import type { ContentItem } from '../../shared/config/supabase'

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

describe('ResultCard', () => {
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
})
