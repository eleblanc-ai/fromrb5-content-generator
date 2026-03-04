import { useMemo, useRef, useState, useEffect } from 'react'
import { supabase } from '../../shared/config/supabase'
import type { ContentItem, FlyerBrief, FlyerCopyBlock, FlyerFormat } from '../../shared/config/supabase'
import { getFlyerTypography, buildGoogleFontsUrl } from './typography'
import type { FlyerTypography } from './typography'

interface Props {
  item: ContentItem
  threadId?: string
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

interface LayerStyle {
  fontSizeRem: number
  fontFamily: string
  color: string
}

const DEFAULT_LAYERS: TextLayer[] = [
  { key: 'headline', label: 'Headline', x: 50, y: 36 },
  { key: 'tagline', label: 'Tagline', x: 50, y: 44 },
  { key: 'body', label: 'Body', x: 50, y: 52 },
  { key: 'cta', label: 'CTA', x: 50, y: 63 },
]

const AVAILABLE_FONTS = [
  'Playfair Display',
  'Cormorant Garamond',
  'Oswald',
  'Nunito',
  'DM Sans',
  'Lato',
  'Montserrat',
  'Open Sans',
]

function parseMetadata(item: ContentItem): FlyerMetadata | null {
  if (item.type !== 'flyer_text' || !item.text_output) return null
  try {
    return JSON.parse(item.text_output) as FlyerMetadata
  } catch {
    return null
  }
}

function makeLayerStyles(typo: FlyerTypography): Record<keyof FlyerCopyBlock, LayerStyle> {
  return {
    headline: { fontSizeRem: typo.headlineSizeRem, fontFamily: typo.headlineFont, color: '#ffffff' },
    tagline: { fontSizeRem: typo.taglineSizeRem, fontFamily: typo.bodyFont, color: '#ffffff' },
    body: { fontSizeRem: typo.bodySizeRem, fontFamily: typo.bodyFont, color: '#ffffff' },
    cta: { fontSizeRem: typo.ctaSizeRem, fontFamily: typo.headlineFont, color: '#ffffff' },
  }
}

function layerFontWeight(key: keyof FlyerCopyBlock, typo: FlyerTypography): number {
  return key === 'headline' || key === 'cta' ? typo.headlineWeight : typo.bodyWeight
}

function injectGoogleFonts(typography: FlyerTypography) {
  const id = `gf-${typography.headlineFont}-${typography.bodyFont}`.replace(/\s+/g, '-')
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = buildGoogleFontsUrl(typography)
  document.head.appendChild(link)
}

function injectSingleFont(fontFamily: string) {
  const id = `gf-single-${fontFamily.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:ital,wght@0,400;0,700&display=swap`
  document.head.appendChild(link)
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = words[0] ?? ''
  for (let i = 1; i < words.length; i++) {
    const test = current + ' ' + words[i]
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current)
      current = words[i]
    } else {
      current = test
    }
  }
  lines.push(current)
  return lines
}

export default function FlyerEditor({ item, threadId, onIterated, onDeleted }: Props) {
  const metadata = useMemo(() => parseMetadata(item), [item])

  const typography = useMemo(
    () => getFlyerTypography(metadata?.flyer?.fontVibe ?? ''),
    [metadata?.flyer?.fontVibe],
  )

  const [copy, setCopy] = useState<FlyerCopyBlock | null>(metadata?.copy ?? null)
  const [layers, setLayers] = useState<TextLayer[]>(DEFAULT_LAYERS.map((l) => ({ ...l })))
  const [bgUrl, setBgUrl] = useState<string | null>(item.image_url)
  const [showScrim, setShowScrim] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [selectedLayer, setSelectedLayer] = useState<keyof FlyerCopyBlock | null>(null)
  const [layerStyles, setLayerStyles] = useState<Record<keyof FlyerCopyBlock, LayerStyle>>(
    () => makeLayerStyles(typography),
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{
    key: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  // Load Google Fonts whenever the typography pairing changes; preload all available fonts
  useEffect(() => {
    injectGoogleFonts(typography)
    AVAILABLE_FONTS.forEach(injectSingleFont)
  }, [typography])

  useEffect(() => {
    setCopy(metadata?.copy ?? null)
    setBgUrl(item.image_url)
    setLayers(DEFAULT_LAYERS.map((l) => ({ ...l })))
    setLayerStyles(makeLayerStyles(typography))
    setSelectedLayer(null)
  }, [item.id, metadata?.copy, item.image_url, typography])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.querySelectorAll<HTMLTextAreaElement>('[data-layer-key]').forEach((ta) => {
      ta.style.height = 'auto'
      if (ta.scrollHeight > 0) {
        ta.style.height = `${ta.scrollHeight}px`
      }
    })
  }, [copy])

  // Reset textarea widths to default when the item changes (DOM-only; not in style prop so user drags persist)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.querySelectorAll<HTMLTextAreaElement>('[data-layer-key]').forEach((ta) => {
      ta.style.width = '280px'
    })
  }, [item.id])

  function updateLayerStyle(key: keyof FlyerCopyBlock, changes: Partial<LayerStyle>) {
    setLayerStyles((prev) => ({ ...prev, [key]: { ...prev[key], ...changes } }))
  }

  function handleFontSizeChange(key: keyof FlyerCopyBlock, delta: number) {
    setLayerStyles((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        fontSizeRem: Math.max(0.5, Math.round((prev[key].fontSizeRem + delta) * 10) / 10),
      },
    }))
  }

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
        threadId,
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

  async function handleDownload() {
    if (!bgUrl || !copy) return

    const format: FlyerFormat = metadata?.flyer?.format ?? 'instagram_post'
    const width = 1080
    const height = format === 'instagram_story' ? 1920 : 1080

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    const containerEl = containerRef.current
    img.onload = async () => {
      // Wait for Google Fonts to be available before drawing
      await document.fonts.ready

      ctx.drawImage(img, 0, 0, width, height)

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const containerW = containerEl?.getBoundingClientRect().width ?? width
      const scaleToCanvas = width / containerW

      for (const layer of layers) {
        const text = copy[layer.key]
        if (!text) continue
        const px = (layer.x / 100) * width
        const py = (layer.y / 100) * height
        const ls = layerStyles[layer.key]
        const weight = layerFontWeight(layer.key, typography)

        // Derive canvas font size from the textarea's actual rendered px size, scaled to canvas
        const ta = containerEl?.querySelector<HTMLTextAreaElement>(`[data-layer-key="${layer.key}"]`)
        const editorFontPx = ta ? parseFloat(getComputedStyle(ta).fontSize) : ls.fontSizeRem * 16
        const fontSize = Math.round(editorFontPx * scaleToCanvas)
        ctx.font = `${weight} ${fontSize}px "${ls.fontFamily}", serif`

        // Scale the textarea's rendered width to canvas coordinates for WYSIWYG wrapping
        const taWidth = ta ? ta.getBoundingClientRect().width : containerW * 0.3
        const canvasMaxWidth = (taWidth / containerW) * width

        const lines = getWrappedLines(ctx, text, canvasMaxWidth)
        const lineHeightPx = fontSize
        const totalHeight = lines.length * lineHeightPx

        if (showScrim) {
          const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
          const padX = 24
          const padY = 14
          ctx.shadowBlur = 0
          ctx.fillStyle = 'rgba(0,0,0,0.35)'
          ctx.beginPath()
          ctx.roundRect(
            px - maxLineWidth / 2 - padX,
            py - totalHeight / 2 - padY,
            maxLineWidth + padX * 2,
            totalHeight + padY * 2,
            8,
          )
          ctx.fill()
        }

        ctx.shadowColor = showScrim ? 'transparent' : 'rgba(0,0,0,0.65)'
        ctx.shadowBlur = showScrim ? 0 : 14
        ctx.fillStyle = ls.color
        lines.forEach((line, i) => {
          const lineY = py - totalHeight / 2 + (i + 0.5) * lineHeightPx
          ctx.fillText(line, px, lineY)
        })
        ctx.shadowBlur = 0
      }

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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-3">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider shrink-0">Flyer editor</span>

        {selectedLayer && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-ink capitalize shrink-0">{selectedLayer}</span>
            <select
              value={layerStyles[selectedLayer].fontFamily}
              onChange={(e) => {
                injectSingleFont(e.target.value)
                updateLayerStyle(selectedLayer, { fontFamily: e.target.value })
              }}
              aria-label="Font family"
              className="text-xs border border-border rounded px-1 py-0.5 bg-canvas text-ink min-w-0 truncate"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleFontSizeChange(selectedLayer, -0.1)}
              aria-label="Decrease font size"
              className="text-xs text-ink-muted hover:text-ink transition-colors shrink-0"
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange(selectedLayer, 0.1)}
              aria-label="Increase font size"
              className="text-xs text-ink-muted hover:text-ink transition-colors shrink-0"
            >
              A+
            </button>
            <input
              type="color"
              value={layerStyles[selectedLayer].color}
              onChange={(e) => updateLayerStyle(selectedLayer, { color: e.target.value })}
              aria-label="Text color"
              className="w-5 h-5 border-0 p-0 cursor-pointer rounded shrink-0"
            />
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {deleteError && <span className="text-xs text-red-500">{deleteError}</span>}
          <button
            type="button"
            onClick={() => setShowScrim((s) => !s)}
            aria-label="Toggle scrim"
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            {showScrim ? 'Scrim ●' : 'Scrim ○'}
          </button>
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
              ...(showScrim
                ? { background: 'rgba(0,0,0,0.35)', borderRadius: '8px', padding: '2px 10px 2px 4px' }
                : {}),
            }}
          >
            <button
              type="button"
              aria-label={`Drag ${layer.key}`}
              onMouseDown={(e) => handleDragStart(layer.key, e)}
              className="cursor-grab active:cursor-grabbing text-white/70 hover:text-white text-sm px-1 shrink-0 select-none"
              style={{ textShadow: showScrim ? 'none' : '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              ⠿
            </button>
            <textarea
              value={copy[layer.key]}
              onChange={(e) => {
                const key = layer.key
                const val = e.target.value
                setCopy((prev) => (prev ? { ...prev, [key]: val } : prev))
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                if (el.scrollHeight > 0) {
                  el.style.height = `${el.scrollHeight}px`
                }
              }}
              onFocus={() => setSelectedLayer(layer.key)}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={layer.label}
              data-layer-key={layer.key}
              className="bg-transparent border-none outline-none text-center resize min-w-[120px]"
              style={{
                textShadow: showScrim ? 'none' : '0 1px 4px rgba(0,0,0,0.8)',
                fontFamily: `"${layerStyles[layer.key].fontFamily}", serif`,
                fontSize: `${layerStyles[layer.key].fontSizeRem}rem`,
                fontWeight: layerFontWeight(layer.key, typography),
                color: layerStyles[layer.key].color,
                minHeight: `${layerStyles[layer.key].fontSizeRem}rem`,
                lineHeight: '1',
                padding: 0,
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
