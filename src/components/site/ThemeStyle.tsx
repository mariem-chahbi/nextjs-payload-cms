import { DEFAULT_COLORS } from '@/fields/themeDefaults'
import type { Theme } from '@/payload-types'
import { fontStack, pickThemeFonts } from '@/utilities/googleFonts'

const RADII: Record<string, string> = { none: '0px', sm: '4px', md: '8px', lg: '14px', xl: '22px' }

type Palette = Record<keyof typeof DEFAULT_COLORS.light, string>

const paletteVars = (palette: Partial<Palette> | null | undefined, fallback: Palette) =>
  (Object.keys(fallback) as (keyof Palette)[])
    .map((key) => `--color-${key}:${palette?.[key] || fallback[key]};`)
    .join('')

/** Builds the CSS variables for the Theme global. Pure: also used by tests. */
export const themeCSS = (theme: Partial<Theme> | null | undefined, rtl: boolean): string => {
  const light = paletteVars(theme?.colors as Partial<Palette>, DEFAULT_COLORS.light)
  const dark = paletteVars(theme?.darkColors as Partial<Palette>, DEFAULT_COLORS.dark)
  const { heading, body } = pickThemeFonts(theme?.fonts, rtl)
  const typography = theme?.typography
  const layout = theme?.layout
  const radius = RADII[layout?.borderRadius ?? 'md'] ?? RADII.md
  const buttonRadius = layout?.buttonStyle === 'pill' ? '999px' : layout?.buttonStyle === 'square' ? '0px' : radius

  const base = [
    `--font-heading:${fontStack(heading)};`,
    `--font-body:${fontStack(body)};`,
    `--font-size-base:${typography?.baseFontSize ?? 17}px;`,
    `--heading-scale:${typography?.headingScale ?? '1.25'};`,
    `--heading-weight:${typography?.headingWeight ?? '700'};`,
    `--line-height:${typography?.lineHeight ?? 1.65};`,
    `--radius:${radius};`,
    `--radius-button:${buttonRadius};`,
    `--container:${layout?.containerWidth ?? 1200}px;`,
  ].join('')

  const mode = theme?.darkMode ?? 'off'
  if (mode === 'on') return `:root{${dark}${base}color-scheme:dark;}`
  if (mode === 'system') {
    return `:root{${light}${base}color-scheme:light dark;}@media (prefers-color-scheme: dark){:root{${dark}}}`
  }
  return `:root{${light}${base}color-scheme:light;}`
}

/** Theme global → CSS variables. Arabic pages get the Arabic heading/body fonts. */
export function ThemeStyle({ theme, rtl }: { theme: Partial<Theme> | null | undefined; rtl: boolean }) {
  return <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCSS(theme, rtl) }} />
}
