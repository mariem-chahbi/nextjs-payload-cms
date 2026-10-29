import { DEFAULT_FONTS, findFont, type FontDefinition } from '@/fields/fonts'

export const GOOGLE_FONTS_ORIGIN = 'https://fonts.googleapis.com'
export const GOOGLE_FONTS_STATIC_ORIGIN = 'https://fonts.gstatic.com'

export type ThemeFonts = {
  latinHeading?: string | null
  latinBody?: string | null
  arabicHeading?: string | null
  arabicBody?: string | null
}

/**
 * One Google Fonts CSS2 URL for the given font ids (unknown ids are ignored, duplicates merged).
 * css2 serves every script of a family (Arabic included) as unicode-range blocks, so the browser
 * downloads only the glyphs a page uses. `display=swap` keeps text visible while fonts load.
 */
export const buildGoogleFontsHref = (fontIds: (string | null | undefined)[]): string | undefined => {
  const fonts = [...new Map(fontIds.map(findFont).filter(Boolean).map((f) => [f!.value, f!])).values()]
  if (fonts.length === 0) return undefined
  const families = fonts
    .sort((a, b) => a.family.localeCompare(b.family))
    .map((font) => `family=${font.family.replace(/ /g, '+')}:wght@${[...font.weights].sort((a, b) => a - b).join(';')}`)
  return `${GOOGLE_FONTS_ORIGIN}/css2?${families.join('&')}&display=swap`
}

/** Heading and body fonts for a page: Arabic choices on RTL (Arabic) pages, Latin otherwise. */
export const pickThemeFonts = (fonts: ThemeFonts | null | undefined, rtl: boolean): { heading: FontDefinition; body: FontDefinition } => {
  const headingId = rtl ? fonts?.arabicHeading ?? DEFAULT_FONTS.arabicHeading : fonts?.latinHeading ?? DEFAULT_FONTS.latinHeading
  const bodyId = rtl ? fonts?.arabicBody ?? DEFAULT_FONTS.arabicBody : fonts?.latinBody ?? DEFAULT_FONTS.latinBody
  return {
    heading: findFont(headingId) ?? findFont(rtl ? DEFAULT_FONTS.arabicHeading : DEFAULT_FONTS.latinHeading)!,
    body: findFont(bodyId) ?? findFont(rtl ? DEFAULT_FONTS.arabicBody : DEFAULT_FONTS.latinBody)!,
  }
}

/** CSS font-family value with fallbacks: "'Cairo', 'Segoe UI', Tahoma, sans-serif". */
export const fontStack = (font: FontDefinition): string => `'${font.family}', ${font.fallback}`
