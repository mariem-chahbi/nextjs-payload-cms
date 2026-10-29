import { ButtonGroup } from '@/components/site/CMSLink'
import { ImageFrame } from '@/components/site/ImageFrame'
import { RichText } from '@/components/site/RichText'
import type { MediaTextBlock as MediaTextBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

const RATIO: Record<string, string> = { '1/3': '1fr 2fr', '1/2': '1fr 1fr', '2/3': '2fr 1fr' }

/** Media at the start, end, top or bottom. "start"/"end" mirror automatically in Arabic. */
export function MediaTextComponent({ block, ctx }: { block: MediaTextBlockData; ctx: RenderContext }) {
  const position = block.mediaPosition ?? 'start'
  const horizontal = position === 'start' || position === 'end'
  const template = RATIO[block.ratio ?? '1/2'] ?? RATIO['1/2']
  return (
    <div
      className={`media-text media-text-${position}`}
      style={{
        gridTemplateColumns: horizontal ? (position === 'start' ? template : template.split(' ').reverse().join(' ')) : undefined,
        alignItems: block.verticalAlign ?? 'center',
      }}
    >
      <div className={`media-text-media${block.roundedMedia ? ' rounded' : ''}`}>
        <ImageFrame media={block.media} ratio={block.imageRatio} fit={block.imageFit} controls sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
      <div className="media-text-body">
        <RichText data={block.content} locale={ctx.locale} homePageId={ctx.homePageId} />
        <ButtonGroup buttons={block.buttons as never} locale={ctx.locale} homePageId={ctx.homePageId} />
      </div>
    </div>
  )
}
