import { useMemo, useRef, useState, useEffect } from 'react'
import { supabase } from '../../shared/config/supabase'
import type { ContentItem, FlyerBrief, FlyerCopyBlock, FlyerFormat } from '../../shared/config/supabase'

interface Props {
  item: ContentItem
  onIterated?: (item: ContentItem) => void
  onDeleted?: () => void
}

interface FlyerMetadata {
  flyer?: FlyerBrief
  copy?: FlyerCopyBlock
}

interface TextLayer {
  key: keyof FlyerCopyBlock
  label: string
  x: number
  y: number
}

const DEFAULT_LAYERS: TextLayer[] = [
  { key: 'headline', label: 'Headline', x: 50, y: 36 },
  { key: 'tagline', label: 'Tagline', x: 50, y: 44 },
  { key: 'body', label: 'Body', x: 50, y: 52 },
  { key: 'cta', label: 'CTA', x: 50, y: 63 },
]

const FONT_SIZES_POST: Record<keyof FlyerCopyBlock, number> = {
  headline: 80,
  tagline: 48,
  body: 40,
  cta: 52,
}

const FONT_SIZES_STORY: Record<keyof FlyerCopyBlock, number> = {
  headline: 90,
  tagline: 54,
  body: 44,
  cta: 60,
}

function parseMetadata(item: ContentItem): FlyerMetadata | null {
  if (item.type !== 'flyer_text' || !item.text_output) return null
  try {
    return JSON.parse(item.text_output) as FlyerMetadata
  } catch {
    return null
  }
}

export default function FlyerEditor({ item, onIterated, onDeleted }: Props) {
  const metadata = useMemo(() => parseMetadata(item), [item])

  const [copy, setCopy] = useState<FlyerCopyBlock | null>(metadata?.copy ?? null)
  const [layers, setLayers] = useState<TextLayer[]>(DEFAULT_LAYERS.map((l) => ({ ...l })))
  const [bgUrl, setBgUrl] = useState<string | null>(item.image_url)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{
    key: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  useEffect(() => {
    setCopy(metadata?.copy ?? null)
    setBgUrl(item.image_url)
    setLayers(DEFAULT_LAYERS.map((l) => ({ ...l })))
  }, [item.id, metadata?.copy, item.image_url])

  function handleDragStart(key: string, e: React.MouseEvent) {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const layer = layers.find((l) => l.key === key)
    if (!layer) return

    draggingRef.current = {
      key,
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    }

    function onMove(ev: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - draggingRef.current.startX) / rect.width) * 100
      const dy = ((ev.clientY - draggingRef.current.startY) / rect.height) * 100
      const newX = Math.max(5, Math.min(95, draggingRef.current.origX + dx))
      const newY = Math.max(5, Math.min(95, draggingRef.current.origY + dy))
      const k = draggingRef.current.key
      setLayers((prev) => prev.map((l) => (l.key === k ? { ...l, x: newX, y: newY } : l)))
    }

    function onUp() {
      draggingRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  async function handleRegenerateArt() {
    if (!metadata?.flyer) return

    setRegenerating(true)
    setRegenerateError(null)

    const { data, error } = await supabase.functions.invoke('generate-flyer', {
      body: {
        type: 'flyer_text',
        prompt: item.prompt,
        flyer: metadata.flyer,
        copyOverride: copy ?? undefined,
        parentId: item.id,
      },
    })

    setRegenerating(false)

    if (error) {
      setRegenerateError(error.message)
      return
    }

    const response = data as { item: ContentItem }
    setBgUrl(response.item.image_url)
    onIterated?.(response.item)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)

    const { error } = await supabase.from('content_items').delete().eq('id', item.id)

    setDeleting(false)

    if (error) {
      setDeleteError(error.message)
      return
    }

    onDeleted?.()
  }

  function handleDownload() {
    if (!bgUrl || !copy) return

    const format: FlyerFormat = metadata?.flyer?.format ?? 'instagram_post'
    const width = 1080
    const height = format === 'instagram_story' ? 1920 : 1080
    const fontSizes = format === 'instagram_story' ? FONT_SIZES_STORY : FONT_SIZES_POST

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)

      ctx.shadowColor = 'rgba(0,0,0,0.65)'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (const layer of layers) {
        const text = copy[layer.key]
        if (!text) continue
        const px = (layer.x / 100) * width
        const py = (layer.y / 100) * height
        const fontSize = fontSizes[layer.key]
        const isBold = layer.key === 'headline' || layer.key === 'cta'
        ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
        ctx.fillText(text, px, py)
      }

      ctx.shadowBlur = 0

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `flyer-${item.id}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
    img.src = bgUrl
  }

  if (!metadata?.flyer || !copy) {
    return (
      <div className="border border-border rounded-lg p-6 bg-surface">
        <p className="text-sm text-ink-muted">No flyer data available.</p>
      </div>
    )
  }

  const isStory = metadata.flyer.format === 'instagram_story'

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Flyer editor</span>
        <div className="flex items-center gap-3">
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

      <div
        ref={containerRef}
        data-testid="flyer-canvas"
        className="relative w-full select-none overflow-hidden"
        style={{ aspectRatio: isStory ? '9/16' : '1/1' }}
      >
        {bgUrl ? (
          <img src={bgUrl} alt="Flyer background" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gray-100" />
        )}

        {layers.map((layer) => (
          <div
            key={layer.key}
            className="absolute flex items-center gap-1"
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <button
              type="button"
              aria-label={`Drag ${layer.key}`}
              onMouseDown={(e) => handleDragStart(layer.key, e)}
              className="cursor-grab active:cursor-grabbing text-white/70 hover:text-white text-sm px-1 shrink-0 select-none"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              ⠿
            </button>
            <textarea
              value={copy[layer.key]}
              onChange={(e) => {
                const key = layer.key
                const val = e.target.value
                setCopy((prev) => (prev ? { ...prev, [key]: val } : prev))
              }}
              onMouseDown={(e) => e.stopPropagation()}
              rows={1}
              aria-label={layer.label}
              className="bg-transparent border-none outline-none text-white text-center resize-none overflow-hidden min-w-[120px] max-w-[280px]"
              style={{
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                fontWeight: layer.key === 'headline' || layer.key === 'cta' ? 700 : 400,
                fontSize:
                  layer.key === 'headline'
                    ? '1.1rem'
                    : layer.key === 'cta'
                      ? '1rem'
                      : '0.85rem',
              }}
            />
          </div>
        ))}
      </div>

      <div className="px-4 py-3 space-y-2">
        {regenerateError && <p className="text-sm text-red-500">{regenerateError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRegenerateArt}
            disabled={regenerating}
            className="flex-1 bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {regenerating ? 'Generating...' : 'Regenerate art'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!bgUrl}
            className="border border-border text-ink rounded-lg px-4 py-2 text-sm font-medium hover:bg-canvas transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
