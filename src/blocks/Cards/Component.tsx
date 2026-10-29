import { CMSLink } from '@/components/site/CMSLink'
import { Icon } from '@/components/site/Icon'
import { ImageFrame } from '@/components/site/ImageFrame'
import type { CardsBlock as CardsBlockData } from '@/payload-types'

import { responsiveColumnVars } from '../responsiveVars'
import type { RenderContext } from '../types'

export function CardsComponent({ block, ctx }: { block: CardsBlockData; ctx: RenderContext }) {
  return (
    <div className="cards-block">
      {block.heading || block.intro ? (
        <header className="block-header">
          {block.heading ? <h2>{block.heading}</h2> : null}
          {block.intro ? <p className="lead">{block.intro}</p> : null}
        </header>
      ) : null}
      <div className="grid-cols" style={responsiveColumnVars(block.columns, 3)}>
        {(block.cards ?? []).map((card, i) => (
          <article key={card.id ?? i} className={`card card-${block.cardStyle ?? 'elevated'}`}>
            {card.image ? (
              <ImageFrame
                className="card-media"
                media={card.image}
                ratio={block.imageRatio ?? '16/10'}
                fit={block.imageFit}
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
            ) : card.icon ? (
              <div className="card-icon">
                <Icon name={card.icon} size="1.75em" />
              </div>
            ) : null}
            <div className="card-body">
              <h3>{card.title}</h3>
              {card.text ? <p>{card.text}</p> : null}
              {card.linkLabel ? (
                <CMSLink link={card.link as never} locale={ctx.locale} homePageId={ctx.homePageId} className="card-link">
                  {card.linkLabel} <Icon name="arrow-right" />
                </CMSLink>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
