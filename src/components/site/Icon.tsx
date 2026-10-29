import type { CSSProperties } from 'react'

import { ICONS, type IconName } from '@/lexical/icons'

/** Inline SVG icon. Arrows flip in RTL (via the `.icon-mirror` rule in globals.css). */
export function Icon({ name, size = '1em', color, className, title }: { name: string | null | undefined; size?: string; color?: string; className?: string; title?: string }) {
  const icon = name ? ICONS[name as IconName] : undefined
  if (!icon) return null
  const style: CSSProperties = { width: size, height: size, color, display: 'inline-block', verticalAlign: '-0.125em' }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[('mirror' in icon && icon.mirror) ? 'icon-mirror' : '', className].filter(Boolean).join(' ')}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
