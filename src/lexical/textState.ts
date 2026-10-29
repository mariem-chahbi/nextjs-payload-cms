/**
 * Rich-text styles for TextStateFeature: text color, highlight and size.
 * No package imports (used by the editor on the server/client and by the site renderer).
 *
 * Theme colors are CSS variables, so a text colored "Primary" follows the Theme global.
 */
type StateValue = { label: string; css: Record<string, string> }

const swatch = (label: string, value: string, property: 'color' | 'background-color'): StateValue => ({
  label,
  css: property === 'color' ? { color: value } : { 'background-color': value, 'border-radius': '0.2em', padding: '0 0.15em' },
})

const PALETTE: [string, string, string][] = [
  ['red', 'Red', '#dc2626'],
  ['orange', 'Orange', '#ea580c'],
  ['amber', 'Amber', '#d97706'],
  ['green', 'Green', '#16a34a'],
  ['teal', 'Teal', '#0d9488'],
  ['blue', 'Blue', '#2563eb'],
  ['purple', 'Purple', '#9333ea'],
  ['pink', 'Pink', '#db2777'],
  ['gray', 'Gray', '#6b7280'],
]

const HIGHLIGHTS: [string, string, string][] = [
  ['yellow', 'Yellow', '#fef08a'],
  ['green', 'Green', '#bbf7d0'],
  ['blue', 'Blue', '#bfdbfe'],
  ['pink', 'Pink', '#fbcfe8'],
  ['orange', 'Orange', '#fed7aa'],
]

export const textStateConfig = {
  color: {
    'theme-primary': swatch('Theme: primary', 'var(--color-primary)', 'color'),
    'theme-secondary': swatch('Theme: secondary', 'var(--color-secondary)', 'color'),
    'theme-accent': swatch('Theme: accent', 'var(--color-accent)', 'color'),
    'theme-muted': swatch('Theme: muted', 'var(--color-muted)', 'color'),
    ...Object.fromEntries(PALETTE.map(([key, label, hex]) => [key, swatch(label, hex, 'color')])),
  },
  highlight: {
    'theme-accent': swatch('Theme: accent', 'color-mix(in srgb, var(--color-accent) 30%, transparent)', 'background-color'),
    ...Object.fromEntries(HIGHLIGHTS.map(([key, label, hex]) => [key, swatch(label, hex, 'background-color')])),
  },
  size: {
    xs: { label: 'Extra small', css: { 'font-size': '0.75em' } },
    sm: { label: 'Small', css: { 'font-size': '0.875em' } },
    lg: { label: 'Large', css: { 'font-size': '1.25em' } },
    xl: { label: 'Extra large', css: { 'font-size': '1.5em' } },
    '2xl': { label: '2× large', css: { 'font-size': '2em' } },
    '3xl': { label: '3× large', css: { 'font-size': '3em', 'line-height': '1.1' } },
  },
} satisfies Record<string, Record<string, StateValue>>

export type TextStateKey = keyof typeof textStateConfig

/** CSS for a text node's `$` state, e.g. { color: 'red', size: 'xl' } → { color: '#dc2626', fontSize: '1.5em' }. */
export const textStateToStyle = (state: Record<string, unknown> | undefined | null): Record<string, string> => {
  if (!state) return {}
  const style: Record<string, string> = {}
  for (const [key, value] of Object.entries(state)) {
    const group = textStateConfig[key as TextStateKey] as Record<string, StateValue> | undefined
    const entry = typeof value === 'string' ? group?.[value] : undefined
    if (!entry) continue
    for (const [prop, cssValue] of Object.entries(entry.css)) {
      style[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = cssValue
    }
  }
  return style
}
