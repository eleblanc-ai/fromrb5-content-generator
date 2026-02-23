import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GenerateForm from './GenerateForm'

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock('../../shared/config/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}))

const mockTextItem = {
  id: '123',
  type: 'tea_writeup' as const,
  prompt: 'Write about green tea',
  text_output: 'A delicate green tea with vegetal notes...',
  image_url: null,
  parent_id: null,
  created_at: '2026-02-22T00:00:00Z',
}

const mockImageItem = {
  id: '456',
  type: 'image' as const,
  prompt: 'A tin of green tea on a wooden table',
  text_output: null,
  image_url: 'https://example.com/image.png',
  parent_id: null,
  created_at: '2026-02-22T00:00:00Z',
}

describe('GenerateForm', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
  })

  it('renders content type selector, prompt textarea, and button', () => {
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe what you need...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
  })

  it('shows all content types including image', () => {
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByRole('option', { name: 'Flyer copy' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Tea writeup' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Communication' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Image' })).toBeInTheDocument()
  })

  it('disables submit when prompt is empty', () => {
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled()
  })

  it('calls generate-text and fires onResult for text types', async () => {
    mockInvoke.mockResolvedValue({ data: { item: mockTextItem }, error: null })
    const onResult = vi.fn()
    render(<GenerateForm onResult={onResult} />)

    await userEvent.type(
      screen.getByPlaceholderText('Describe what you need...'),
      'Write about green tea',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate-text', {
        body: { prompt: 'Write about green tea', type: 'tea_writeup' },
      })
      expect(onResult).toHaveBeenCalledWith(mockTextItem)
    })
  })

  it('calls generate-image when image type is selected', async () => {
    mockInvoke.mockResolvedValue({ data: { item: mockImageItem }, error: null })
    const onResult = vi.fn()
    render(<GenerateForm onResult={onResult} />)

    await userEvent.selectOptions(screen.getByRole('combobox'), 'image')
    await userEvent.type(
      screen.getByPlaceholderText('Describe what you need...'),
      'A tin of green tea on a wooden table',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate-image', {
        body: { prompt: 'A tin of green tea on a wooden table', type: 'image' },
      })
      expect(onResult).toHaveBeenCalledWith(mockImageItem)
    })
  })

  it('shows error message on failure', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'API call failed' } })
    render(<GenerateForm onResult={() => {}} />)

    await userEvent.type(
      screen.getByPlaceholderText('Describe what you need...'),
      'Write about tea',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => {
      expect(screen.getByText('API call failed')).toBeInTheDocument()
    })
  })
})
