import { formatNumber, type NumberStyle } from '@/i18n/format'
import type { StatsBlock as StatsBlockData } from '@/payload-types'

import { responsiveColumnVars } from '../responsiveVars'
import type { RenderContext } from '../types'

/** Numbers formatted for the visitor's region: digits, currency, compact notation. */
export function StatsComponent({ block, ctx }: { block: StatsBlockData; ctx: RenderContext }) {
  return (
    <div className="stats-block">
      {block.heading ? <h2 className="block-title">{block.heading}</h2> : null}
      <dl className="grid-cols stats" style={responsiveColumnVars(block.columns, 4)}>
        {(block.stats ?? []).map((stat, i) => (
          <div key={stat.id ?? i} className="stat">
            <dt>{stat.label}</dt>
            <dd>
              {stat.prefix}
              {formatNumber(stat.value, {
                locale: ctx.locale,
                region: ctx.region as never,
                style: (stat.format ?? 'number') as NumberStyle,
                decimals: stat.decimals ?? 0,
              })}
              {stat.suffix}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
