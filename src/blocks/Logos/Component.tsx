import type { CSSProperties } from 'react'

import { Media } from '@/components/site/Media'
import type { LogosBlock as LogosBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

export function LogosComponent({ block }: { block: LogosBlockData; ctx: RenderContext }) {
  const logos = block.logos ?? []
  const items = block.autoScroll ? [...logos, ...logos] : logos
  return (
    <div className="logos-block">
      {block.heading ? <p className="logos-heading">{block.heading}</p> : null}
      <div
        className={`logos${block.grayscale ? ' logos-gray' : ''}${block.autoScroll ? ' logos-marquee' : ''}`}
        style={{ '--logo-h': `${block.logoHeight ?? 40}px` } as CSSProperties}
      >
        <ul className="logos-track">
          {items.map((logo, i) => {
            // Fill the fixed logo slot and "contain": wide, square and tall logos all fit uncropped.
            const image = <Media media={logo.image} alt={logo.name} sizes="200px" fit="contain" fill />
            return (
              <li key={`${logo.id ?? 'logo'}-${i}`} aria-hidden={i >= logos.length || undefined}>
                {logo.url ? (
                  <a href={logo.url} target="_blank" rel="noopener noreferrer" aria-label={logo.name ?? undefined}>
                    {image}
                  </a>
                ) : (
                  image
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
