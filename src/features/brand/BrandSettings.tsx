import { useState, useEffect } from 'react'
import { supabase } from '../../shared/config/supabase'
import type { BrandSettings } from '../../shared/config/supabase'

interface Props {
  onClose: () => void
}

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

export default function BrandSettingsPanel({ onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [brandTagline, setBrandTagline] = useState('')
  const [colorPalette, setColorPalette] = useState<string[]>([])
  const [fontPreference, setFontPreference] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = (await (supabase as any)
        .from('brand_settings')
        .select('*')
        .limit(1)
        .maybeSingle()) as { data: BrandSettings | null }

      if (data) {
        setSettingsId(data.id)
        setBrandName(data.brand_name)
        setBrandTagline(data.brand_tagline)
        setColorPalette(data.color_palette)
        setFontPreference(data.font_preference)
        setLogoUrl(data.logo_url)
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    const payload = {
      brand_name: brandName,
      brand_tagline: brandTagline,
      color_palette: colorPalette,
      font_preference: fontPreference,
      logo_url: logoUrl,
    }

    let error: unknown = null

    if (settingsId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('brand_settings')
        .update(payload)
        .eq('id', settingsId)
      error = result.error
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('brand_settings')
        .insert(payload)
        .select('id')
        .single()
      error = result.error
      if (!error && result.data) {
        setSettingsId(result.data.id as string)
      }
    }

    setSaving(false)
    if (error) {
      setSaveError((error as { message: string }).message)
    } else {
      onClose()
    }
  }

  function addColor() {
    if (colorPalette.length < 5) {
      setColorPalette([...colorPalette, '#ffffff'])
    }
  }

  function updateColor(index: number, value: string) {
    setColorPalette(colorPalette.map((c, i) => (i === index ? value : c)))
  }

  function removeColor(index: number) {
    setColorPalette(colorPalette.filter((_, i) => i !== index))
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Brand Kit"
        className="fixed right-0 top-0 h-full w-80 bg-canvas border-l border-border z-50 flex flex-col shadow-lg"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Brand Kit</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close brand settings"
            className="text-ink-muted hover:text-ink transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-ink-muted">Loading…</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-ink-muted uppercase tracking-wider"
                htmlFor="brand-name"
              >
                Brand name
              </label>
              <input
                id="brand-name"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Fromrb5 Tea"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-ink-muted uppercase tracking-wider"
                htmlFor="brand-tagline"
              >
                Tagline
              </label>
              <input
                id="brand-tagline"
                type="text"
                value={brandTagline}
                onChange={(e) => setBrandTagline(e.target.value)}
                placeholder="e.g. Sip with intention"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider block">
                Color palette
              </span>
              <div className="space-y-2">
                {colorPalette.map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor(i, e.target.value)}
                      aria-label={`Color ${i + 1}`}
                      className="w-8 h-8 border border-border rounded cursor-pointer p-0.5 bg-transparent"
                    />
                    <span className="text-xs text-ink font-mono">{color}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      aria-label={`Remove color ${i + 1}`}
                      className="text-xs text-ink-muted hover:text-red-500 transition-colors ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {colorPalette.length < 5 && (
                <button
                  type="button"
                  onClick={addColor}
                  className="text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  + Add color
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-ink-muted uppercase tracking-wider"
                htmlFor="font-preference"
              >
                Font preference
              </label>
              <select
                id="font-preference"
                value={fontPreference}
                onChange={(e) => setFontPreference(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">No preference</option>
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {saveError && <p className="text-sm text-red-500">{saveError}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
