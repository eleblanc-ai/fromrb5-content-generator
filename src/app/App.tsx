import { useEffect, useState } from 'react'
import { GenerateForm, ResultCard } from '../features/generate'
import { supabase } from '../shared/config/supabase'
import type { ContentItem } from '../shared/config/supabase'

export default function App() {
  const [history, setHistory] = useState<ContentItem[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadHistory() {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (!active) return

      if (error) {
        setHistoryError(error.message)
        return
      }

      setHistory(data ?? [])
    }

    loadHistory()

    return () => {
      active = false
    }
  }, [])

  function handleResult(item: ContentItem) {
    setHistory((current) => [item, ...current.filter((existing) => existing.id !== item.id)])
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border px-8 py-5">
        <h1 className="text-base font-semibold tracking-tight">Content Studio</h1>
      </header>
      <main className="max-w-3xl mx-auto px-8 py-16 space-y-8">
        <GenerateForm onResult={handleResult} />

        {historyError && <p className="text-sm text-red-500">{historyError}</p>}

        {history.length > 0 && (
          <section className="space-y-4" aria-label="Content history">
            {history.map((item) => (
              <ResultCard key={item.id} item={item} onIterated={handleResult} onDeleted={() => setHistory((h) => h.filter((x) => x.id !== item.id))} />
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
