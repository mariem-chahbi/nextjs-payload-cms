import { isVisibleInRegion } from '@/i18n/regions'

import { BlockShell, type BlockStyle } from './BlockShell'
import { blockComponents } from './registry'
import type { RenderContext } from './types'

export type AnyBlock = {
  id?: string | null
  blockType: string
  style?: (BlockStyle & { showInRegions?: unknown[] | null }) | null
  [key: string]: unknown
}

/** Blocks shown in this region: "Show in regions" empty = everywhere. */
export const filterBlocksForRegion = <T extends AnyBlock>(blocks: T[] | null | undefined, regionCode: string | undefined): T[] =>
  (blocks ?? []).filter((block) =>
    isVisibleInRegion(block.style?.showInRegions as never, regionCode),
  )

/** blockType → component, each wrapped in the shared Style shell. Unknown types render nothing. */
export function RenderBlocks({ blocks, ctx }: { blocks: AnyBlock[] | null | undefined; ctx: RenderContext }) {
  const visible = filterBlocksForRegion(blocks, ctx.region?.code)
  if (visible.length === 0) return null
  return (
    <>
      {visible.map((block, index) => {
        const entry = blockComponents[block.blockType]
        if (!entry) return null
        const { Component, bleed } = entry
        return (
          <BlockShell key={block.id ?? `${block.blockType}-${index}`} blockType={block.blockType} style={block.style} bleed={bleed}>
            <Component block={block as never} ctx={ctx} index={index} />
          </BlockShell>
        )
      })}
    </>
  )
}
