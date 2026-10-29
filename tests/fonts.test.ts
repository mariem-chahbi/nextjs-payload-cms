import { describe, expect, it } from 'vitest'

import { themeCSS } from '@/components/site/ThemeStyle'
import { ARABIC_FONTS } from '@/fields/fonts'
import { buildGoogleFontsHref, pickThemeFonts } from '@/utilities/googleFonts'

const theme = { fonts: { latinHeading: 'playfair-display', latinBody: 'inter', arabicHeading: 'cairo', arabicBody: 'tajawal' } }

describe('Google Fonts <link> builder', () => {
  it('builds one css2 URL with weights and display=swap', () => {
    expect(buildGoogleFontsHref(['inter', 'cairo'])).toBe(
      'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    )
  })

  it('encodes spaces, merges duplicates and ignores unknown or empty ids', () => {
    const href = buildGoogleFontsHref(['noto-kufi-arabic', 'noto-kufi-arabic', 'comic-sans', null, undefined])
    expect(href).toBe('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap')
    expect(buildGoogleFontsHref(['nope'])).toBeUndefined()
  })

  it('only requests weights a family has (Google rejects the whole URL otherwise)', () => {
    expect(buildGoogleFontsHref(['amiri'])).toContain('family=Amiri:wght@400;700&')
    expect(buildGoogleFontsHref(['almarai'])).toContain('family=Almarai:wght@400;700&')
  })

  it('every Arabic choice is an Arabic-capable family', () => {
    expect(ARABIC_FONTS.map((f) => f.value)).toEqual(
      expect.arrayContaining(['cairo', 'tajawal', 'noto-kufi-arabic']),
    )
  })
})

describe('theme fonts per direction', () => {
  it('Arabic pages use the Arabic heading/body fonts, other pages the Latin ones', () => {
    expect(pickThemeFonts(theme.fonts, true)).toMatchObject({ heading: { family: 'Cairo' }, body: { family: 'Tajawal' } })
    expect(pickThemeFonts(theme.fonts, false)).toMatchObject({ heading: { family: 'Playfair Display' }, body: { family: 'Inter' } })
  })

  it('falls back to defaults for unknown font ids', () => {
    expect(pickThemeFonts({ arabicBody: 'unknown' }, true).body.family).toBe('Tajawal')
  })

  it('exposes fonts and colors as CSS variables', () => {
    const ar = themeCSS({ ...theme, colors: { primary: '#ff0000' } } as never, true)
    expect(ar).toContain("--font-heading:'Cairo'")
    expect(ar).toContain("--font-body:'Tajawal'")
    expect(ar).toContain('--color-primary:#ff0000;')
    expect(themeCSS(theme as never, false)).toContain("--font-heading:'Playfair Display'")
  })

  it('dark mode: always dark, or follow the device', () => {
    expect(themeCSS({ darkMode: 'on' } as never, false)).toContain('color-scheme:dark')
    expect(themeCSS({ darkMode: 'system' } as never, false)).toContain('@media (prefers-color-scheme: dark)')
  })
})
