import { ButtonGroup } from '@/components/site/CMSLink'
import { RichText } from '@/components/site/RichText'
import type { CTABlock as CTABlockData } from '@/payload-types'

import type { RenderContext } from '../types'

export function CTAComponent({ block, ctx }: { block: CTABlockData; ctx: RenderContext }) {
  return (
    <div className={`cta cta-${block.layout ?? 'centered'}`}>
      <RichText data={block.content} locale={ctx.locale} homePageId={ctx.homePageId} />
      <ButtonGroup buttons={block.buttons as never} locale={ctx.locale} homePageId={ctx.homePageId} />
    </div>
  )
}
