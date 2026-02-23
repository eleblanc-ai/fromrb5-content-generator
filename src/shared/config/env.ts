export const env = {
  get supabaseUrl(): string {
    const val = import.meta.env.VITE_SUPABASE_URL
    if (!val) throw new Error('Missing required env var: VITE_SUPABASE_URL')
    return val
  },
  get supabaseAnonKey(): string {
    const val = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!val) throw new Error('Missing required env var: VITE_SUPABASE_ANON_KEY')
    return val
  },
}
