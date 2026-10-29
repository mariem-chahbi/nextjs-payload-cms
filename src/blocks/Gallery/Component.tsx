import type { CSSProperties } from 'react'

import type { GalleryBlock as GalleryBlockData } from '@/payload-types'

import { responsiveColumnVars } from '../responsiveVars'
import type { RenderContext } from '../types'
import { tr } from '../types'
import { GalleryClient } from './GalleryClient'

export function GalleryComponent({ block, ctx }: { block: GalleryBlockData; ctx: RenderContext }) {
  const images = (block.images ?? []).filter((item) => item.image && typeof item.image === 'object')
  return (
    <GalleryClient
      images={images.map((item) => ({ id: item.id ?? undefined, image: item.image as never, caption: item.caption ?? undefined }))}
      layout={block.layout ?? 'grid'}
      lightbox={block.lightbox !== false}
      ratio={block.imageRatio ?? '4/3'}
      fit={block.imageFit ?? 'cover'}
      style={{ ...responsiveColumnVars(block.columns, 3), gap: `var(--space-${block.gap ?? 'md'})` } as CSSProperties}
      labels={{
        close: tr(ctx, 'gallery.close', 'Close'),
        previous: tr(ctx, 'gallery.previous', 'Previous'),
        next: tr(ctx, 'gallery.next', 'Next'),
      }}
    />
  )
}
