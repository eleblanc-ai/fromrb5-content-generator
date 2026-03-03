import { useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import { supabase } from '../../shared/config/supabase'
import type { ContentItem, FlyerBrief } from '../../shared/config/supabase'

const TYPE_LABELS: Record<string, string> = {
  flyer_text: 'Flyer copy',
  tea_writeup: 'Tea writeup',
  communication: 'Communication',
  image: 'Image',
}

interface Props {
  item: ContentItem
  onIterated?: (item: ContentItem) => void
}

interface FlyerVariant {
  id: string
  prompt: string
  image_url: string | null
}

interface FlyerCardMetadata {
  flyer?: FlyerBrief
  variants?: FlyerVariant[]
}

interface FlyerInvokeResponse {
  item: ContentItem
  variants?: FlyerVariant[]
}

function parseFlyerMetadata(item: ContentItem): FlyerCardMetadata | null {
  if (item.type !== 'flyer_text' || !item.text_output) {
    return null
  }

  try {
    const parsed = JSON.parse(item.text_output) as FlyerCardMetadata
    return parsed
  } catch {
    return null
  }
}

function withVariants(item: ContentItem, variants: FlyerVariant[] | undefined): ContentItem {
  if (item.type !== 'flyer_text' || !variants || variants.length === 0) {
    return item
  }

  const metadata = parseFlyerMetadata(item) ?? {}

  return {
    ...item,
    text_output: JSON.stringify({
      ...metadata,
      variants,
    }),
  }
}

export default function ResultCard({ item, onIterated }: Props) {
  const flyerMetadata = useMemo(() => parseFlyerMetadata(item), [item])
  const flyerVariants = useMemo(
    () => (flyerMetadata?.variants ?? []).filter((variant) => Boolean(variant.image_url)),
    [flyerMetadata?.variants],
  )

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    flyerVariants[0]?.id ?? null,
  )
  const [iterationPrompt, setIterationPrompt] = useState('')
  const [iterating, setIterating] = useState(false)
  const [iterationError, setIterationError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadAllError, setDownloadAllError] = useState<string | null>(null)
  const canIterateImage = item.type === 'image' && Boolean(item.image_url)

  useEffect(() => {
    setSelectedVariantId(flyerVariants[0]?.id ?? null)
  }, [item.id, flyerVariants])

  const selectedVariant = useMemo(() => {
    if (flyerVariants.length === 0) {
      return null
    }

    return (
      flyerVariants.find((variant) => variant.id === selectedVariantId) ??
      flyerVariants[0]
    )
  }, [flyerVariants, selectedVariantId])

  const previewImageUrl = selectedVariant?.image_url ?? item.image_url
  const isFlyerStructured = item.type === 'flyer_text' && Boolean(flyerMetadata?.flyer)
  const showCopyText = Boolean(item.text_output) && !isFlyerStructured

  async function handleCopyText() {
    if (!item.text_output) return
    if (!navigator.clipboard) return

    await navigator.clipboard.writeText(item.text_output)
  }

  function handleDownloadImage() {
    const downloadUrl = previewImageUrl
    if (!downloadUrl) return

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${item.type}-${item.id}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function handleIterateImage(e: React.FormEvent) {
    e.preventDefault()

    if (!canIterateImage || !iterationPrompt.trim()) return

    setIterating(true)
    setIterationError(null)

    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt: iterationPrompt,
        type: 'image',
        parentId: item.id,
        sourceImageUrl: item.image_url,
      },
    })

    setIterating(false)

    if (error) {
      setIterationError(error.message)
      return
    }

    onIterated?.(data.item as ContentItem)
    setIterationPrompt('')
  }

  async function handleRegenerateVariant() {
    if (!isFlyerStructured || !selectedVariant?.image_url || !flyerMetadata?.flyer) {
      return
    }

    setRegenerating(true)
    setRegenerateError(null)

    const { data, error } = await supabase.functions.invoke('generate-flyer', {
      body: {
        type: 'flyer_text',
        prompt: item.prompt,
        flyer: flyerMetadata.flyer,
        parentId: selectedVariant.id,
        sourceImageUrl: selectedVariant.image_url,
      },
    })

    setRegenerating(false)

    if (error) {
      setRegenerateError(error.message)
      return
    }

    const response = data as FlyerInvokeResponse
    onIterated?.(withVariants(response.item, response.variants))
  }

  async function handleDownloadAllVariants() {
    if (flyerVariants.length === 0) return

    setDownloadingAll(true)
    setDownloadAllError(null)

    try {
      const zip = new JSZip()

      for (let i = 0; i < flyerVariants.length; i += 1) {
        const variant = flyerVariants[i]
        if (!variant.image_url) continue

        const fetchResponse = await fetch(variant.image_url)
        if (!fetchResponse.ok) throw new Error(`Failed to fetch variant ${i + 1}`)

        const blob = await fetchResponse.blob()
        const ext = blob.type.includes('jpeg') ? 'jpg' : 'png'
        zip.file(`flyer-variant-${i + 1}.${ext}`, blob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flyer-variants-${item.id}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadAllError((err as Error).message)
    }

    setDownloadingAll(false)
  }

  return (
    <div className="border border-border rounded-lg p-6 space-y-3 bg-surface">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
      </div>
      <p className="text-xs text-ink-muted italic">{item.prompt}</p>
      {showCopyText && item.text_output && (
        <div className="space-y-3">
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{item.text_output}</p>
          <button
            type="button"
            onClick={handleCopyText}
            className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Copy
          </button>
        </div>
      )}
      {item.image_url && (
        <div className="space-y-3">
          {previewImageUrl && <img src={previewImageUrl} alt={item.prompt} className="w-full rounded-lg" />}

          {flyerVariants.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {flyerVariants.map((variant, index) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  aria-label={`Select variant ${index + 1}`}
                  className={`rounded-lg border overflow-hidden ${
                    selectedVariant?.id === variant.id ? 'border-purple-500' : 'border-border'
                  }`}
                >
                  {variant.image_url && (
                    <img
                      src={variant.image_url}
                      alt={`Variant ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadImage}
            className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Download
          </button>

          {flyerVariants.length > 1 && (
            <div className="space-y-1">
              {downloadAllError && <p className="text-sm text-red-500">{downloadAllError}</p>}
              <button
                type="button"
                onClick={handleDownloadAllVariants}
                disabled={downloadingAll}
                className="text-xs font-medium text-ink-muted hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingAll ? 'Preparing zip...' : 'Download all variants'}
              </button>
            </div>
          )}

          {isFlyerStructured && selectedVariant && (
            <div className="space-y-2">
              {regenerateError && <p className="text-sm text-red-500">{regenerateError}</p>}
              <button
                type="button"
                onClick={handleRegenerateVariant}
                disabled={regenerating}
                className="w-full bg-purple-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate selected variant'}
              </button>
            </div>
          )}

          {canIterateImage && (
            <form onSubmit={handleIterateImage} className="space-y-2">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                Iterate image
              </label>
              <textarea
                value={iterationPrompt}
                onChange={(e) => setIterationPrompt(e.target.value)}
                placeholder="Describe how to refine this image..."
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
              {iterationError && <p className="text-sm text-red-500">{iterationError}</p>}
              <button
                type="submit"
                disabled={iterating || !iterationPrompt.trim()}
                className="w-full bg-purple-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {iterating ? 'Iterating...' : 'Iterate image'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
