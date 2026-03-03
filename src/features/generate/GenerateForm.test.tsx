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
  type: 'flyer_text' as const,
  prompt: 'Campaign goal: Drive weekend tea tasting signups',
  text_output: JSON.stringify({
    flyer: {
      campaignGoal: 'Drive weekend tea tasting signups',
      productName: 'Jasmine Green Reserve',
      keyDetails: 'First flush jasmine pearls, floral aroma, small-batch packaging',
      cta: 'Tap to order today',
      tone: 'Premium and warm',
      colorVibe: 'Lavender and charcoal',
      fontVibe: 'Modern editorial sans',
      formatConstraints: 'Keep safe margins for profile UI overlays',
      format: 'instagram_story',
      renderMode: 'overlay',
    },
    variantIndex: 1,
  }),
  image_url: null,
  parent_id: null,
  created_at: '2026-02-22T00:00:00Z',
}

async function fillRequiredFields() {
  await userEvent.type(
    screen.getByPlaceholderText('Drive weekend tea tasting signups'),
    'Drive weekend tea tasting signups',
  )
  await userEvent.type(
    screen.getByPlaceholderText('Jasmine Green Reserve'),
    'Jasmine Green Reserve',
  )
  await userEvent.type(
    screen.getByPlaceholderText('First flush jasmine pearls, floral aroma, small-batch packaging'),
    'First flush jasmine pearls, floral aroma, small-batch packaging',
  )
  await userEvent.type(
    screen.getByPlaceholderText('Tap to order today'),
    'Tap to order today',
  )
  await userEvent.type(screen.getByPlaceholderText('Premium and warm'), 'Premium and warm')
  await userEvent.type(
    screen.getByPlaceholderText('Lavender and charcoal'),
    'Lavender and charcoal',
  )
  await userEvent.type(
    screen.getByPlaceholderText('Modern editorial sans'),
    'Modern editorial sans',
  )
  await userEvent.type(
    screen.getByPlaceholderText('Keep safe margins for profile UI overlays'),
    'Keep safe margins for profile UI overlays',
  )
}

describe('GenerateForm', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
  })

  it('renders flyer brief fields, selectors, and submit button', () => {
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByPlaceholderText('Drive weekend tea tasting signups')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Jasmine Green Reserve')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tap to order today')).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Generate flyer brief' })).toBeInTheDocument()
  })

  it('shows format and render mode options', () => {
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByRole('option', { name: 'Instagram Post' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Instagram Story' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'AI composed' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Overlay' })).toBeInTheDocument()
  })

  it('disables submit until required brief fields are filled', () => {
    render(<GenerateForm onResult={() => {}} />)
    expect(screen.getByRole('button', { name: 'Generate flyer brief' })).toBeDisabled()
  })

  it('submits flyer payload and fires onResult', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        item: mockTextItem,
        variants: [
          { id: 'v1', prompt: 'Variant 1', image_url: 'https://example.com/v1.png' },
          { id: 'v2', prompt: 'Variant 2', image_url: 'https://example.com/v2.png' },
          { id: 'v3', prompt: 'Variant 3', image_url: 'https://example.com/v3.png' },
        ],
      },
      error: null,
    })
    const onResult = vi.fn()
    render(<GenerateForm onResult={onResult} />)

    await fillRequiredFields()
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'instagram_story')
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'overlay')
    await userEvent.click(screen.getByRole('button', { name: 'Generate flyer brief' }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate-flyer', {
        body: {
          type: 'flyer_text',
          prompt: [
            'Campaign goal: Drive weekend tea tasting signups',
            'Product name: Jasmine Green Reserve',
            'Key details: First flush jasmine pearls, floral aroma, small-batch packaging',
            'Call to action: Tap to order today',
            'Tone: Premium and warm',
            'Color vibe: Lavender and charcoal',
            'Font vibe: Modern editorial sans',
            'Format constraints: Keep safe margins for profile UI overlays',
            'Target format: instagram_story',
          ].join('\n'),
          flyer: {
            campaignGoal: 'Drive weekend tea tasting signups',
            productName: 'Jasmine Green Reserve',
            keyDetails: 'First flush jasmine pearls, floral aroma, small-batch packaging',
            cta: 'Tap to order today',
            tone: 'Premium and warm',
            colorVibe: 'Lavender and charcoal',
            fontVibe: 'Modern editorial sans',
            formatConstraints: 'Keep safe margins for profile UI overlays',
            format: 'instagram_story',
            renderMode: 'overlay',
          },
        },
      })
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          type: 'flyer_text',
          prompt: 'Campaign goal: Drive weekend tea tasting signups',
        }),
      )
    })

    const submittedItem = onResult.mock.calls[0][0] as { text_output: string }
    const parsed = JSON.parse(submittedItem.text_output)
    expect(parsed.variants).toHaveLength(3)
    expect(parsed.variants[1].id).toBe('v2')
  })

  it('shows error message on failure', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'API call failed' } })
    render(<GenerateForm onResult={() => {}} />)

    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: 'Generate flyer brief' }))

    await waitFor(() => {
      expect(screen.getByText('API call failed')).toBeInTheDocument()
    })
  })
})
