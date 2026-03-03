import { useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { supabase } from '../../shared/config/supabase'
import type { ContentItem, FlyerBrief, FlyerCopyBlock, FlyerFormat } from '../../shared/config/supabase'

const TYPE_LABELS: Record<string, string> = {
  flyer_text: 'Flyer copy',
  tea_writeup: 'Tea writeup',
  communication: 'Communication',
  image: 'Image',
}

interface Props {
  item: ContentItem
  onIterated?: (item: ContentItem) => void
  onDeleted?: () => void
}

interface FlyerVariant {
  id: string
  prompt: string
  image_url: string | null
}

interface FlyerCardMetadata {
  flyer?: FlyerBrief
  variants?: FlyerVariant[]
  copy?: FlyerCopyBlock
}

interface FlyerInvokeResponse {
  item: ContentItem
  variants?: FlyerVariant[]
}

const OVERLAY_LAYOUT: Record<FlyerFormat, { headline: number; tagline: number; body: number; cta: number; headlineSize: number; taglineSize: number; bodySize: number; ctaSize: number }> = {
  instagram_post: { headline: 390, tagline: 470, body: 545, cta: 635, headlineSize: 80, taglineSize: 48, bodySize: 40, ctaSize: 52 },
  instagram_story: { headline: 820, tagline: 930, body: 1030, cta: 1130, headlineSize: 90, taglineSize: 54, bodySize: 44, ctaSize: 60 },
}

async function renderFlyerOverlay(
  canvas: HTMLCanvasElement,
  backgroundUrl: string,
  copy: FlyerCopyBlock,
  format: FlyerFormat,
): Promise<string> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/png')

  const width = 1080
  const height = format === 'instagram_story' ? 1920 : 1080
  canvas.width = width
  canvas.height = height

  const response = await fetch(backgroundUrl)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(blobUrl)
      resolve()
    }
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('Failed to load background image'))
    }
    img.src = blobUrl
  })

  const layout = OVERLAY_LAYOUT[format]
  const centerX = width / 2

  ctx.shadowColor = 'rgba(0,0,0,0.65)'
  ctx.shadowBlur = 14
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.font = `bold ${layout.headlineSize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillText(copy.headline, centerX, layout.headline)

  ctx.font = `${layout.taglineSize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillText(copy.tagline, centerX, layout.tagline)

  ctx.font = `${layout.bodySize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillText(copy.body, centerX, layout.body)

  ctx.font = `bold ${layout.ctaSize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillText(copy.cta, centerX, layout.cta)

  ctx.shadowBlur = 0

  return canvas.toDataURL('image/png')
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

export default function ResultCard({ item, onIterated, onDeleted }: Props) {
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
  const [editedCopy, setEditedCopy] = useState<FlyerCopyBlock | null>(
    flyerMetadata?.copy ?? null,
  )
  const [rerenderLoading, setRerenderLoading] = useState(false)
  const [rerenderError, setRerenderError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [overlayDataUrls, setOverlayDataUrls] = useState<Record<string, string>>({})
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map())

  const isOverlay = flyerMetadata?.flyer?.renderMode === 'overlay'
  const canIterateImage = item.type === 'image' && Boolean(item.image_url)

  useEffect(() => {
    setSelectedVariantId(flyerVariants[0]?.id ?? null)
  }, [item.id, flyerVariants])

  useEffect(() => {
    setEditedCopy(flyerMetadata?.copy ?? null)
  }, [item.id, flyerMetadata?.copy])

  useEffect(() => {
    if (!isOverlay || !flyerMetadata?.copy || flyerVariants.length === 0) return

    const copy = flyerMetadata.copy
    const format = flyerMetadata.flyer?.format ?? 'instagram_post'

    async function renderAll() {
      const newUrls: Record<string, string> = {}

      for (const variant of flyerVariants) {
        if (!variant.image_url) continue

        const canvas = canvasRefs.current.get(variant.id)
        if (!canvas) continue

        try {
          const dataUrl = await renderFlyerOverlay(canvas, variant.image_url, copy, format)
          newUrls[variant.id] = dataUrl
        } catch {
          // fall back to raw background url
        }
      }

      setOverlayDataUrls(newUrls)
    }

    renderAll()
  }, [isOverlay, flyerVariants, flyerMetadata?.copy, flyerMetadata?.flyer?.format])

  const selectedVariant = useMemo(() => {
    if (flyerVariants.length === 0) {
      return null
    }

    return (
      flyerVariants.find((variant) => variant.id === selectedVariantId) ??
      flyerVariants[0]
    )
  }, [flyerVariants, selectedVariantId])

  const rawPreviewUrl = selectedVariant?.image_url ?? item.image_url
  const previewImageUrl = isOverlay && selectedVariant
    ? (overlayDataUrls[selectedVariant.id] ?? rawPreviewUrl)
    : rawPreviewUrl

  const isFlyerStructured = item.type === 'flyer_text' && Boolean(flyerMetadata?.flyer)
  const showCopyText = Boolean(item.text_output) && !isFlyerStructured

  async function handleCopyText() {
    if (!item.text_output) return
    if (!navigator.clipboard) return

    await navigator.clipboard.writeText(item.text_output)
  }

  function handleDownloadImage() {
    const downloadUrl = isOverlay && selectedVariant
      ? (overlayDataUrls[selectedVariant.id] ?? rawPreviewUrl)
      : rawPreviewUrl
    if (!downloadUrl) return

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${item.type}-${item.id}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)

    const variantIds = flyerMetadata?.variants?.map((v) => v.id) ?? []
    const ids = [...new Set([item.id, ...variantIds])]

    const { error } = await supabase.from('content_items').delete().in('id', ids)

    setDeleting(false)

    if (error) {
      setDeleteError(error.message)
      return
    }

    onDeleted?.()
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

        if (isOverlay && overlayDataUrls[variant.id]) {
          const dataUrl = overlayDataUrls[variant.id]
          const base64 = dataUrl.split(',')[1]
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
          zip.file(`flyer-variant-${i + 1}.png`, bytes)
        } else {
          const fetchResponse = await fetch(variant.image_url)
          if (!fetchResponse.ok) throw new Error(`Failed to fetch variant ${i + 1}`)

          const blob = await fetchResponse.blob()
          const ext = blob.type.includes('jpeg') ? 'jpg' : 'png'
          zip.file(`flyer-variant-${i + 1}.${ext}`, blob)
        }
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

  async function handleRerenderWithEdits() {
    if (!isFlyerStructured || !editedCopy || !flyerMetadata?.flyer) return

    setRerenderLoading(true)
    setRerenderError(null)

    const { data, error } = await supabase.functions.invoke('generate-flyer', {
      body: {
        type: 'flyer_text',
        prompt: item.prompt,
        flyer: flyerMetadata.flyer,
        copyOverride: editedCopy,
        parentId: selectedVariant?.id ?? item.id,
        sourceImageUrl: selectedVariant?.image_url ?? item.image_url,
      },
    })

    setRerenderLoading(false)

    if (error) {
      setRerenderError(error.message)
      return
    }

    const response = data as FlyerInvokeResponse
    onIterated?.(withVariants(response.item, response.variants))
  }

  return (
    <div className="border border-border rounded-lg p-6 space-y-3 bg-surface">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
        <div className="flex items-center gap-2">
          {deleteError && <span className="text-xs text-red-500">{deleteError}</span>}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete"
            className="text-xs text-ink-muted hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
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
          {flyerVariants.map((variant) => (
            <canvas
              key={variant.id}
              ref={(el) => {
                if (el) canvasRefs.current.set(variant.id, el)
                else canvasRefs.current.delete(variant.id)
              }}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          ))}

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
                      src={isOverlay ? (overlayDataUrls[variant.id] ?? variant.image_url) : variant.image_url}
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

          {isFlyerStructured && editedCopy && (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Copy</p>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">Headline</label>
                <input
                  value={editedCopy.headline}
                  onChange={(e) => setEditedCopy({ ...editedCopy, headline: e.target.value })}
                  aria-label="Headline"
                  className="w-full border border-border rounded px-2 py-1 text-sm bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">Tagline</label>
                <input
                  value={editedCopy.tagline}
                  onChange={(e) => setEditedCopy({ ...editedCopy, tagline: e.target.value })}
                  aria-label="Tagline"
                  className="w-full border border-border rounded px-2 py-1 text-sm bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">Body</label>
                <textarea
                  value={editedCopy.body}
                  onChange={(e) => setEditedCopy({ ...editedCopy, body: e.target.value })}
                  aria-label="Body"
                  rows={2}
                  className="w-full border border-border rounded px-2 py-1 text-sm bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">CTA</label>
                <input
                  value={editedCopy.cta}
                  onChange={(e) => setEditedCopy({ ...editedCopy, cta: e.target.value })}
                  aria-label="CTA"
                  className="w-full border border-border rounded px-2 py-1 text-sm bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
              {rerenderError && <p className="text-sm text-red-500">{rerenderError}</p>}
              <button
                type="button"
                onClick={handleRerenderWithEdits}
                disabled={rerenderLoading}
                className="w-full border border-purple-400 text-purple-600 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rerenderLoading ? 'Re-rendering...' : 'Re-render with edits'}
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
