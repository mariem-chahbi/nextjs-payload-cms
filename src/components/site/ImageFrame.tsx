import type { ComponentProps } from 'react'

import { Media } from './Media'

type ImageFrameProps = Omit<ComponentProps<typeof Media>, 'fill' | 'fit'> & {
  /** "16/9", "1/1"… or "original" (keep the uploaded proportions). */
  ratio?: string | null
  fit?: 'cover' | 'contain' | null
  className?: string
}

/**
 * Shows any image or video in a chosen shape. With a ratio the media fills a box of that shape:
 * "cover" crops around the focal point, "contain" shows the whole image. "original" = natural size.
 */
export function ImageFrame({ ratio, fit, className, ...media }: ImageFrameProps) {
  if (!ratio || ratio === 'original') {
    return className ? (
      <div className={className}>
        <Media {...media} />
      </div>
    ) : (
      <Media {...media} />
    )
  }
  return (
    <div className={['media-frame', className].filter(Boolean).join(' ')} style={{ aspectRatio: ratio }}>
      <Media {...media} fill fit={fit ?? 'cover'} />
    </div>
  )
}
