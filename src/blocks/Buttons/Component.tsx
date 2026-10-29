import { ButtonGroup } from '@/components/site/CMSLink'
import type { ButtonsBlock as ButtonsBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

export function ButtonsComponent({ block, ctx }: { block: ButtonsBlockData; ctx: RenderContext }) {
  return (
    <ButtonGroup
      buttons={block.buttons as never}
      locale={ctx.locale}
      homePageId={ctx.homePageId}
      className={`buttons-block buttons-${block.layout ?? 'row'} justify-${block.justify ?? 'start'}`}
    />
  )
}
