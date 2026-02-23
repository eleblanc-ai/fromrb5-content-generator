import { useState } from 'react'
import { GenerateForm, ResultCard } from '../features/generate'
import type { ContentItem } from '../shared/config/supabase'

export default function App() {
  const [result, setResult] = useState<ContentItem | null>(null)

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border px-8 py-5">
        <h1 className="text-base font-semibold tracking-tight">Content Studio</h1>
      </header>
      <main className="max-w-3xl mx-auto px-8 py-16 space-y-8">
        <GenerateForm onResult={setResult} />
        {result && <ResultCard item={result} />}
      </main>
    </div>
  )
}
