import { ButtonGroup } from '@/components/site/CMSLink'
import { Media } from '@/components/site/Media'
import { RichText } from '@/components/site/RichText'
import { colorToCSS } from '@/fields/colorTokens'
import type { HeroBlock as HeroBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

export function HeroComponent({ block, ctx, index }: { block: HeroBlockData; ctx: RenderContext; index: number }) {
  const [vertical, horizontal] = (block.contentPosition ?? 'middle-center').split('-') as [string, string]
  const media = block.media
  const overlay = colorToCSS(media?.overlayColor)
  const opacity = (media?.overlayOpacity ?? 0) / 100
  const isFirst = index === 0

  return (
    <div
      className={`hero hero-h-${block.height ?? 'large'}`}
      data-v={vertical}
      data-h={horizontal}
      data-hero
      style={{ backgroundColor: media?.type === 'color' ? colorToCSS(media.color) : undefined }}
    >
      {media?.type === 'image' && media.image ? (
        <div className="hero-media">
          <Media media={media.image} fill priority={isFirst} sizes="100vw" />
        </div>
      ) : null}
      {media?.type === 'video' && media.video ? (
        <div className="hero-media">
          <Media media={media.video} poster={media.poster} fill autoPlay loop muted />
        </div>
      ) : null}
      {media?.type !== 'color' && overlay && opacity > 0 ? (
        <div className="hero-overlay" style={{ backgroundColor: overlay, opacity }} aria-hidden />
      ) : null}
      <div className={`hero-content container container-${block.contentWidth ?? 'normal'}`}>
        <div className="hero-box">
          <RichText data={block.content} locale={ctx.locale} homePageId={ctx.homePageId} />
          <ButtonGroup buttons={block.buttons as never} locale={ctx.locale} homePageId={ctx.homePageId} />
        </div>
      </div>
    </div>
  )
}
