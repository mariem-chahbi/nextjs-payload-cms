/**
 * Colors are stored either as a theme token ("theme:primary") or a custom hex ("#1e40af").
 * Tokens resolve to CSS variables, so changing the Theme recolors every block that uses them.
 * No package imports: shared by the admin color picker and the site renderer.
 */
export const THEME_COLOR_TOKENS = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'muted'] as const
export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number]

export const COLOR_VALUE_PATTERN = /^(theme:(primary|secondary|accent|background|surface|text|muted)|#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?)$/

export const isColorValue = (value: unknown): value is string =>
  typeof value === 'string' && COLOR_VALUE_PATTERN.test(value)

/** "theme:primary" → "var(--color-primary)", "#ff0000" → "#ff0000", anything else → undefined. */
export const colorToCSS = (value: unknown): string | undefined => {
  if (!isColorValue(value)) return undefined
  return value.startsWith('theme:') ? `var(--color-${value.slice(6)})` : value
}
