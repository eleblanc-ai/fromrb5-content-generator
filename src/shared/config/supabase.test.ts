import { describe, it, expect, vi } from 'vitest'

// Mock env before the supabase client module is initialized
vi.mock('./env', () => ({
  env: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-anon-key',
  },
}))

const { supabase } = await import('./supabase')

describe('supabase client', () => {
  it('initializes without throwing', () => {
    expect(supabase).toBeDefined()
  })

  it('exposes the expected supabase-js shape', () => {
    expect(typeof supabase.from).toBe('function')
    expect(typeof supabase.storage).toBe('object')
  })
})
