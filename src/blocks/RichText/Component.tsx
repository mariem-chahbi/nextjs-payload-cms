import { RichText } from '@/components/site/RichText'
import type { RichTextBlock as RichTextBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

export function RichTextComponent({ block, ctx }: { block: RichTextBlockData; ctx: RenderContext }) {
  return (
    <div className={`rich-text-block text-cols-${block.textColumns ?? '1'}`}>
      <RichText data={block.content} locale={ctx.locale} homePageId={ctx.homePageId} />
    </div>
  )
}
