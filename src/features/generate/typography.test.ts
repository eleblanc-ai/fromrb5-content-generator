import { describe, it, expect } from 'vitest'
import { getFlyerTypography, buildGoogleFontsUrl } from './typography'

describe('getFlyerTypography', () => {
  it('returns Playfair Display + Lato for editorial vibes', () => {
    const t = getFlyerTypography('modern editorial sans')
    expect(t.headlineFont).toBe('Playfair Display')
    expect(t.bodyFont).toBe('Lato')
  })

  it('returns Cormorant Garamond + Montserrat for elegant/luxury vibes', () => {
    const t = getFlyerTypography('elegant luxury serif')
    expect(t.headlineFont).toBe('Cormorant Garamond')
    expect(t.bodyFont).toBe('Montserrat')
  })

  it('returns Oswald + Open Sans for bold/impact vibes', () => {
    const t = getFlyerTypography('bold strong impact')
    expect(t.headlineFont).toBe('Oswald')
    expect(t.bodyFont).toBe('Open Sans')
  })

  it('returns Nunito for warm/friendly vibes', () => {
    const t = getFlyerTypography('friendly warm casual')
    expect(t.headlineFont).toBe('Nunito')
    expect(t.bodyFont).toBe('Nunito')
  })

  it('returns DM Sans default for unknown vibe', () => {
    const t = getFlyerTypography('something completely unrecognised')
    expect(t.headlineFont).toBe('DM Sans')
    expect(t.bodyFont).toBe('DM Sans')
  })

  it('has correct size hierarchy: headline > cta > tagline > body', () => {
    const t = getFlyerTypography('modern clean')
    expect(t.headlineSizeRem).toBeGreaterThan(t.ctaSizeRem)
    expect(t.ctaSizeRem).toBeGreaterThan(t.taglineSizeRem)
    expect(t.taglineSizeRem).toBeGreaterThan(t.bodySizeRem)
  })

  it('headline and cta have bold weight, body has regular weight', () => {
    const t = getFlyerTypography('minimal')
    expect(t.headlineWeight).toBeGreaterThanOrEqual(700)
    expect(t.ctaWeight).toBeGreaterThanOrEqual(700)
    expect(t.bodyWeight).toBe(400)
  })
})

describe('buildGoogleFontsUrl', () => {
  it('includes both headline and body fonts in the URL', () => {
    const t = getFlyerTypography('editorial')
    const url = buildGoogleFontsUrl(t)
    expect(url).toContain('Playfair%20Display')
    expect(url).toContain('Lato')
    expect(url).toContain('fonts.googleapis.com')
  })

  it('deduplicates when headline and body font are the same', () => {
    const t = getFlyerTypography('friendly warm')
    const url = buildGoogleFontsUrl(t)
    const count = url.split('family=').length - 1
    expect(count).toBe(1)
  })
})
