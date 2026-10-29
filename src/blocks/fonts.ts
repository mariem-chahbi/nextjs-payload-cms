import { findFont } from '@/fields/fonts'

/** Named fonts picked in any block's Style tab (recursing into columns), to load them with the page. */
export const collectBlockFonts = (blocks: unknown[] | null | undefined): string[] => {
  const found = new Set<string>()
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (!value || typeof value !== 'object') return
    const record = value as Record<string, unknown>
    const style = record.style as { font?: string } | undefined
    if (style?.font && findFont(style.font)) found.add(style.font)
    for (const [key, child] of Object.entries(record)) {
      if (key !== 'style' && typeof child === 'object') visit(child)
    }
  }
  visit(blocks)
  return [...found].sort()
}
