import { RichText } from '@/components/site/RichText'
import type { FAQBlock as FAQBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

/** Native <details> accordion. One-open-at-a-time uses the shared `name` attribute (no JS). */
export function FAQComponent({ block, ctx, index }: { block: FAQBlockData; ctx: RenderContext; index: number }) {
  const group = block.allowMultiple ? undefined : `faq-${block.id ?? index}`
  return (
    <div className="faq-block">
      {block.heading ? <h2 className="block-title">{block.heading}</h2> : null}
      <div className="faq">
        {(block.items ?? []).map((item, i) => (
          <details key={item.id ?? i} name={group} open={Boolean(block.openFirst && i === 0)}>
            <summary>{item.question}</summary>
            <div className="faq-answer">
              <RichText data={item.answer} locale={ctx.locale} homePageId={ctx.homePageId} />
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
