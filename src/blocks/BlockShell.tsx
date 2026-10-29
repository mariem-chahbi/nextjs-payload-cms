import type { CSSProperties, ReactNode } from 'react'

import { Media } from '@/components/site/Media'
import { colorToCSS } from '@/fields/colorTokens'
import { findFont } from '@/fields/fonts'
import { BREAKPOINTS } from '@/fields/responsive'
import { fontStack } from '@/utilities/googleFonts'

export type BlockStyle = {
  background?: {
    type?: string | null
    color?: string | null
    gradientFrom?: string | null
    gradientTo?: string | null
    gradientAngle?: number | null
    image?: unknown
    video?: unknown
    overlayColor?: string | null
    overlayOpacity?: number | null
  } | null
  textColor?: string | null
  font?: string | null
  textAlign?: string | null
  maxWidth?: string | null
  spacing?: Record<string, Record<string, string | null | undefined> | null | undefined> | null
  hideOnMobile?: boolean | null
  hideOnTablet?: boolean | null
  hideOnDesktop?: boolean | null
  animation?: string | null
  anchorId?: string | null
  cssClass?: string | null
}

const SPACING_VARS: Record<string, string> = {
  paddingTop: 'pt',
  paddingBottom: 'pb',
  paddingInline: 'px',
  marginTop: 'mt',
  marginBottom: 'mb',
}

/** Font override → CSS font-family. Theme roles use the theme variables; named fonts use their stack. */
export const fontFamilyFor = (font: string | null | undefined): string | undefined => {
  if (!font || font === 'inherit') return undefined
  if (font === 'heading') return 'var(--font-heading)'
  if (font === 'body') return 'var(--font-body)'
  const def = findFont(font)
  return def ? fontStack(def) : undefined
}

/** Style tab → inline CSS variables. Breakpoints left on "inherit" set nothing (CSS falls back up). */
export const blockStyleVars = (style: BlockStyle | null | undefined): CSSProperties => {
  const vars: Record<string, string> = {}
  for (const bp of BREAKPOINTS) {
    const values = style?.spacing?.[bp]
    for (const [key, short] of Object.entries(SPACING_VARS)) {
      const value = values?.[key]
      if (value && value !== 'inherit') vars[`--${short}-${bp[0]}`] = `var(--space-${value})`
    }
  }
  const bg = style?.background
  if (bg?.type === 'color' && colorToCSS(bg.color)) vars.backgroundColor = colorToCSS(bg.color)!
  if (bg?.type === 'gradient') {
    const from = colorToCSS(bg.gradientFrom) ?? 'var(--color-primary)'
    const to = colorToCSS(bg.gradientTo) ?? 'var(--color-secondary)'
    vars.backgroundImage = `linear-gradient(${bg.gradientAngle ?? 135}deg, ${from}, ${to})`
  }
  if (colorToCSS(style?.textColor)) vars.color = colorToCSS(style?.textColor)!
  const family = fontFamilyFor(style?.font)
  if (family) vars.fontFamily = family
  if (style?.textAlign && style.textAlign !== 'inherit') vars.textAlign = style.textAlign
  return vars as CSSProperties
}

export const blockClassName = (blockType: string, style: BlockStyle | null | undefined): string =>
  [
    'block',
    `block-${blockType}`,
    style?.hideOnMobile && 'hide-mobile',
    style?.hideOnTablet && 'hide-tablet',
    style?.hideOnDesktop && 'hide-desktop',
    style?.background?.type && style.background.type !== 'none' && 'has-bg',
    style?.cssClass,
  ]
    .filter(Boolean)
    .join(' ')

/** Wraps every block: Style tab (background, colors, font, spacing, width, visibility, animation, anchor). */
export function BlockShell({
  blockType,
  style,
  children,
  bleed = false,
}: {
  blockType: string
  style: BlockStyle | null | undefined
  children: ReactNode
  /** Content manages its own width (e.g. hero, full-width media). */
  bleed?: boolean
}) {
  const bg = style?.background
  const hasMediaBg = (bg?.type === 'image' && bg.image) || (bg?.type === 'video' && bg.video)
  const overlay = colorToCSS(bg?.overlayColor)
  const animation = style?.animation && style.animation !== 'none' ? style.animation : undefined

  return (
    <section
      id={style?.anchorId || undefined}
      className={blockClassName(blockType, style)}
      style={blockStyleVars(style)}
      data-anim={animation}
    >
      {hasMediaBg ? (
        <div className="block-bg" aria-hidden>
          {bg?.type === 'image' ? (
            <Media media={bg.image as never} fill sizes="100vw" />
          ) : (
            <Media media={bg?.video as never} fill autoPlay loop muted />
          )}
          {overlay && (bg?.overlayOpacity ?? 0) > 0 ? (
            <div className="block-overlay" style={{ backgroundColor: overlay, opacity: (bg?.overlayOpacity ?? 0) / 100 }} />
          ) : null}
        </div>
      ) : null}
      <div className={bleed ? 'block-inner block-bleed' : `block-inner container container-${style?.maxWidth ?? 'normal'}`}>
        {children}
      </div>
    </section>
  )
}
