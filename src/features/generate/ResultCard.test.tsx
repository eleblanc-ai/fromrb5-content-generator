import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultCard from './ResultCard'
import type { ContentItem } from '../../shared/config/supabase'

const mockItem: ContentItem = {
  id: '123',
  type: 'tea_writeup',
  prompt: 'Write about green tea',
  text_output: 'A delicate green tea with vegetal notes and a clean finish.',
  image_url: null,
  parent_id: null,
  created_at: '2026-02-22T00:00:00Z',
}

describe('ResultCard', () => {
  it('renders the content type label', () => {
    render(<ResultCard item={mockItem} />)
    expect(screen.getByText('Tea writeup')).toBeInTheDocument()
  })

  it('renders the prompt', () => {
    render(<ResultCard item={mockItem} />)
    expect(screen.getByText('Write about green tea')).toBeInTheDocument()
  })

  it('renders the text output', () => {
    render(<ResultCard item={mockItem} />)
    expect(
      screen.getByText('A delicate green tea with vegetal notes and a clean finish.'),
    ).toBeInTheDocument()
  })
})
