import type { CSSProperties } from 'react'

import { CMSLink } from '@/components/site/CMSLink'
import { ImageFrame } from '@/components/site/ImageFrame'
import { RichText } from '@/components/site/RichText'
import { BREAKPOINTS } from '@/fields/responsive'
import type { FreeLayoutBlock as FreeLayoutBlockData } from '@/payload-types'

import { responsivePxVars } from '../responsiveVars'
import type { RenderContext } from '../types'

type Item = NonNullable<FreeLayoutBlockData['items']>[number]

/**
 * Position of one item as CSS variables per breakpoint (--x-d, --y-t, --w-m, ...).
 * Empty tablet/mobile values inherit the larger screen in CSS.
 * Mirroring: `inset-inline-start` already flips in RTL; rotation is negated to complete the mirror.
 */
export const itemVars = (item: Item, mirrored: boolean): CSSProperties => {
  const vars: Record<string, string> = {}
  for (const bp of BREAKPOINTS) {
    const pos = item.position?.[bp]
    const s = bp[0]
    if (typeof pos?.x === 'number') vars[`--x-${s}`] = `${pos.x}%`
    if (typeof pos?.y === 'number') vars[`--y-${s}`] = `${pos.y}%`
    if (typeof pos?.width === 'number') vars[`--w-${s}`] = `${pos.width}%`
    if (typeof pos?.zIndex === 'number') vars[`--z-${s}`] = String(pos.zIndex)
    if (typeof pos?.rotate === 'number') vars[`--r-${s}`] = `${mirrored ? -pos.rotate : pos.rotate}deg`
  }
  if (typeof item.mobileOrder === 'number') vars['--order-m'] = String(item.mobileOrder)
  return vars as CSSProperties
}

export function FreeLayoutComponent({ block, ctx }: { block: FreeLayoutBlockData; ctx: RenderContext }) {
  const mirror = block.mirrorInRTL !== false
  const mirrored = mirror && ctx.dir === 'rtl'
  return (
    <div
      className={['free-layout', block.stackOnMobile !== false && 'fl-stack', !mirror && 'fl-physical'].filter(Boolean).join(' ')}
      style={responsivePxVars('fl-h', block.height)}
    >
      {(block.items ?? []).map((item, i) => (
        <div key={item.id ?? i} className={`fl-item fl-${item.type}`} style={itemVars(item, mirrored)}>
          {item.type === 'text' ? <RichText data={item.text} locale={ctx.locale} homePageId={ctx.homePageId} /> : null}
          {(item.type === 'image' || item.type === 'video') && item.media ? (
            <div className={`fl-media${item.rounded ? ' rounded' : ''}`}>
              <ImageFrame media={item.media} ratio={item.imageRatio} fit={item.fit ?? 'cover'} autoPlay={item.type === 'video'} loop muted sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
          ) : null}
          {item.type === 'button' && item.button?.label ? (
            <CMSLink link={item.button as never} locale={ctx.locale} homePageId={ctx.homePageId} variant={item.button.variant ?? 'primary'}>
              {item.button.label}
            </CMSLink>
          ) : null}
        </div>
      ))}
    </div>
  )
}
