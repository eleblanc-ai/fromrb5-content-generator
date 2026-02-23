import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock('../shared/config/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('App', () => {
  it('renders the app shell', () => {
    render(<App />)
    expect(screen.getByText('Content Studio')).toBeInTheDocument()
  })

  it('renders the generate form', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
  })
})
