import type { CSSProperties } from 'react'

type Responsive = { desktop?: number | null; tablet?: number | null; mobile?: number | null } | null | undefined

/** Column counts per breakpoint as CSS variables (--cols-d/t/m); mobile defaults to 1. */
export const responsiveColumnVars = (value: Responsive, fallback: number): CSSProperties => {
  const vars: Record<string, string> = { '--cols-d': String(value?.desktop ?? fallback) }
  if (value?.tablet) vars['--cols-t'] = String(value.tablet)
  vars['--cols-m'] = String(value?.mobile ?? 1)
  return vars as CSSProperties
}

/** Pixel values per breakpoint as CSS variables (--<name>-d/t/m). */
export const responsivePxVars = (name: string, value: Responsive): CSSProperties => {
  const vars: Record<string, string> = {}
  if (typeof value?.desktop === 'number') vars[`--${name}-d`] = `${value.desktop}px`
  if (typeof value?.tablet === 'number') vars[`--${name}-t`] = `${value.tablet}px`
  if (typeof value?.mobile === 'number') vars[`--${name}-m`] = `${value.mobile}px`
  return vars as CSSProperties
}
