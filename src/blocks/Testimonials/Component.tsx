import { Icon } from '@/components/site/Icon'
import { Media } from '@/components/site/Media'
import type { TestimonialsBlock as TestimonialsBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

/** Grid, or a CSS scroll-snap slider (no JS; swipe direction follows the page direction). */
export function TestimonialsComponent({ block }: { block: TestimonialsBlockData; ctx: RenderContext }) {
  return (
    <div className="testimonials-block">
      {block.heading ? <h2 className="block-title">{block.heading}</h2> : null}
      <div className={`testimonials testimonials-${block.layout ?? 'grid'}`}>
        {(block.items ?? []).map((item, i) => (
          <figure key={item.id ?? i} className="testimonial">
            {item.rating ? (
              <div className="rating" aria-label={`${item.rating}/5`}>
                {Array.from({ length: 5 }, (_, s) => (
                  <Icon key={s} name="star" className={s < (item.rating ?? 0) ? 'star-on' : 'star-off'} />
                ))}
              </div>
            ) : null}
            <blockquote>{item.quote}</blockquote>
            <figcaption>
              {item.avatar ? (
                <span className="avatar">
                  <Media media={item.avatar} fill sizes="48px" />
                </span>
              ) : null}
              <span>
                <strong>{item.author}</strong>
                {item.role ? <span className="muted">{item.role}</span> : null}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
