import type { CSSProperties } from 'react'

import type { ColumnsBlock as ColumnsBlockData } from '@/payload-types'

import { RenderBlocks, type AnyBlock } from '../RenderBlocks'
import type { RenderContext } from '../types'

const clamp = (n: number | null | undefined) => (typeof n === 'number' ? Math.min(12, Math.max(1, Math.round(n))) : undefined)

/** 12-column grid. Mobile is full width unless set; tablet inherits desktop. */
export const columnVars = (column: NonNullable<ColumnsBlockData['columns']>[number]): CSSProperties => {
  const vars: Record<string, string> = {}
  const d = clamp(column.width?.desktop)
  const t = clamp(column.width?.tablet)
  const m = clamp(column.width?.mobile)
  if (d) vars['--w-d'] = String(d)
  if (t) vars['--w-t'] = String(t)
  if (m) vars['--w-m'] = String(m)
  if (typeof column.mobileOrder === 'number') vars['--order-m'] = String(column.mobileOrder)
  return vars as CSSProperties
}

export function ColumnsComponent({ block, ctx }: { block: ColumnsBlockData; ctx: RenderContext }) {
  return (
    <div
      className="columns-grid"
      style={{ gap: `var(--space-${block.gap ?? 'lg'})`, alignItems: block.verticalAlign ?? 'stretch' }}
    >
      {(block.columns ?? []).map((column, i) => (
        <div key={column.id ?? i} className="column" style={columnVars(column)}>
          <RenderBlocks blocks={column.content as AnyBlock[]} ctx={ctx} />
        </div>
      ))}
    </div>
  )
}
