import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BrandSettingsPanel from './BrandSettings'

const mockMaybeSingle = vi.hoisted(() => vi.fn().mockResolvedValue({ data: null }))
const mockLimit = vi.hoisted(() => vi.fn(() => ({ maybeSingle: mockMaybeSingle })))
const mockSelectForLoad = vi.hoisted(() => vi.fn(() => ({ limit: mockLimit })))

const mockUpdateEq = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
const mockUpdate = vi.hoisted(() => vi.fn(() => ({ eq: mockUpdateEq })))

const mockInsertSingle = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'brand-new' }, error: null }),
)
const mockInsertSelect = vi.hoisted(() => vi.fn(() => ({ single: mockInsertSingle })))
const mockInsert = vi.hoisted(() => vi.fn(() => ({ select: mockInsertSelect })))

const mockFrom = vi.hoisted(() =>
  vi.fn(() => ({
    select: mockSelectForLoad,
    update: mockUpdate,
    insert: mockInsert,
  })),
)

vi.mock('../../shared/config/supabase', () => ({
  supabase: { from: mockFrom },
}))

const mockBrandSettings = {
  id: 'brand-1',
  brand_name: 'Tea House',
  brand_tagline: 'Sip with intention',
  color_palette: ['#7c3aed', '#f3f4f6'],
  font_preference: 'Oswald',
  logo_url: null,
}

describe('BrandSettingsPanel', () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset()
    mockMaybeSingle.mockResolvedValue({ data: null })
    mockUpdateEq.mockReset()
    mockUpdateEq.mockResolvedValue({ error: null })
    mockInsertSingle.mockReset()
    mockInsertSingle.mockResolvedValue({ data: { id: 'brand-new' }, error: null })
    mockFrom.mockClear()
    mockUpdate.mockClear()
    mockInsert.mockClear()
  })

  it('renders brand settings loaded from Supabase', async () => {
    mockMaybeSingle.mockResolvedValue({ data: mockBrandSettings })
    render(<BrandSettingsPanel onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tea House')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Sip with intention')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Oswald')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Remove color/i })).toHaveLength(2)
  })

  it('renders empty form when no brand settings exist', async () => {
    render(<BrandSettingsPanel onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Brand name')).toHaveValue('')
    })
    expect(screen.getByLabelText('Tagline')).toHaveValue('')
    expect(screen.queryByRole('button', { name: /Remove color/i })).not.toBeInTheDocument()
  })

  it('calls update on save when settings already exist', async () => {
    mockMaybeSingle.mockResolvedValue({ data: mockBrandSettings })
    const onClose = vi.fn()
    render(<BrandSettingsPanel onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tea House')).toBeInTheDocument()
    })

    await userEvent.clear(screen.getByLabelText('Brand name'))
    await userEvent.type(screen.getByLabelText('Brand name'), 'New Tea')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ brand_name: 'New Tea' }),
      )
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'brand-1')
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls insert on save when no settings exist', async () => {
    const onClose = vi.fn()
    render(<BrandSettingsPanel onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Brand name')).toBeInTheDocument()
    })

    await userEvent.type(screen.getByLabelText('Brand name'), 'New Brand')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ brand_name: 'New Brand' }),
      )
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<BrandSettingsPanel onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Brand name')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Close brand settings' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('adds a color swatch when + Add color is clicked', async () => {
    render(<BrandSettingsPanel onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('+ Add color')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Add color'))
    expect(screen.getByLabelText('Color 1')).toBeInTheDocument()
  })

  it('removes a color swatch when Remove is clicked', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { ...mockBrandSettings, color_palette: ['#7c3aed'] },
    })
    render(<BrandSettingsPanel onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Color 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Remove color 1' }))
    expect(screen.queryByLabelText('Color 1')).not.toBeInTheDocument()
  })

  it('hides + Add color button when palette has 5 colors', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        ...mockBrandSettings,
        color_palette: ['#1', '#2', '#3', '#4', '#5'],
      },
    })
    render(<BrandSettingsPanel onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Color 5')).toBeInTheDocument()
    })
    expect(screen.queryByText('+ Add color')).not.toBeInTheDocument()
  })
})
