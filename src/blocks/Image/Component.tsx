import { CMSLink } from '@/components/site/CMSLink'
import { ImageFrame } from '@/components/site/ImageFrame'
import type { ImageBlock as ImageBlockData } from '@/payload-types'
import { asMedia } from '@/utilities/media'

import type { RenderContext } from '../types'

const SIZES: Record<string, string> = {
  small: '(min-width: 768px) 360px, 100vw',
  medium: '(min-width: 768px) 640px, 100vw',
  large: '(min-width: 1024px) 960px, 100vw',
  full: '100vw',
}

export function ImageComponent({ block, ctx }: { block: ImageBlockData; ctx: RenderContext }) {
  const media = asMedia(block.image)
  const caption = block.caption || media?.caption
  const image = <ImageFrame media={block.image} ratio={block.imageRatio} fit={block.imageFit} sizes={SIZES[block.size ?? 'large']} />
  return (
    <figure
      className={`image-block image-size-${block.size ?? 'large'} image-align-${block.align ?? 'center'} radius-${block.rounded ?? 'md'} shadow-${block.shadow ?? 'none'}`}
    >
      <div className="image-frame">
        {block.enableLink ? (
          <CMSLink link={block.link as never} locale={ctx.locale} homePageId={ctx.homePageId}>
            {image}
          </CMSLink>
        ) : (
          image
        )}
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
