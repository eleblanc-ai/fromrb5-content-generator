export interface FlyerTypography {
  headlineFont: string
  bodyFont: string
  headlineSizeRem: number
  taglineSizeRem: number
  bodySizeRem: number
  ctaSizeRem: number
  headlineWeight: number
  ctaWeight: number
  bodyWeight: number
}

interface FontPairing {
  keywords: string[]
  headlineFont: string
  bodyFont: string
}

const PAIRINGS: FontPairing[] = [
  { keywords: ['editorial', 'magazine'], headlineFont: 'Playfair Display', bodyFont: 'Lato' },
  { keywords: ['elegant', 'luxury', 'premium'], headlineFont: 'Cormorant Garamond', bodyFont: 'Montserrat' },
  { keywords: ['bold', 'strong', 'impact'], headlineFont: 'Oswald', bodyFont: 'Open Sans' },
  { keywords: ['friendly', 'warm', 'casual'], headlineFont: 'Nunito', bodyFont: 'Nunito' },
]

const DEFAULT_PAIRING: Pick<FontPairing, 'headlineFont' | 'bodyFont'> = {
  headlineFont: 'DM Sans',
  bodyFont: 'DM Sans',
}

export function getFlyerTypography(fontVibe: string): FlyerTypography {
  const vibeL = fontVibe.toLowerCase()
  const pairing = PAIRINGS.find((p) => p.keywords.some((k) => vibeL.includes(k))) ?? DEFAULT_PAIRING

  return {
    headlineFont: pairing.headlineFont,
    bodyFont: pairing.bodyFont,
    headlineSizeRem: 2.6,
    taglineSizeRem: 1.3,
    bodySizeRem: 0.95,
    ctaSizeRem: 1.6,
    headlineWeight: 700,
    ctaWeight: 700,
    bodyWeight: 400,
  }
}

/** Returns the Google Fonts stylesheet URL for the fonts used in a typography config. */
export function buildGoogleFontsUrl(typography: FlyerTypography): string {
  const families = [...new Set([typography.headlineFont, typography.bodyFont])]
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}
