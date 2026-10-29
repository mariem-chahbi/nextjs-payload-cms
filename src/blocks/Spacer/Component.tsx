import { colorToCSS } from '@/fields/colorTokens'
import type { SpacerBlock as SpacerBlockData } from '@/payload-types'

import { responsivePxVars } from '../responsiveVars'
import type { RenderContext } from '../types'

export function SpacerComponent({ block }: { block: SpacerBlockData; ctx: RenderContext }) {
  return (
    <div className="spacer" style={responsivePxVars('h', block.height)} aria-hidden>
      {block.showDivider ? (
        <hr
          style={{
            borderTopStyle: block.dividerStyle ?? 'solid',
            borderTopWidth: `${block.dividerThickness ?? 1}px`,
            borderTopColor: colorToCSS(block.dividerColor) ?? 'var(--color-muted)',
            width: `${block.dividerWidth ?? '100'}%`,
          }}
        />
      ) : null}
    </div>
  )
}
