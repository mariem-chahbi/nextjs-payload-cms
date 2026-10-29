import NextImage from 'next/image'
import type { CSSProperties } from 'react'

import type { Media as MediaDoc } from '@/payload-types'
import { asMedia, focalPosition, isSVG, isVideo, mediaSrc, type MediaRef } from '@/utilities/media'

type MediaProps = {
  media: MediaRef
  /** Fill the parent (which must be positioned) instead of keeping the intrinsic size. */
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
  fit?: 'cover' | 'contain'
  /** Video options */
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  poster?: MediaRef
  alt?: string | null
}

/** Image (next/image, responsive srcset, focal point) or video, depending on the file. */
export function Media({
  media: ref,
  fill,
  sizes = '100vw',
  priority,
  className,
  style,
  fit = 'cover',
  autoPlay,
  loop,
  muted,
  controls,
  poster,
  alt,
}: MediaProps) {
  const media = asMedia(ref)
  const src = mediaSrc(media?.url)
  if (!media || !src) return null

  if (isVideo(media)) {
    const posterSrc = mediaSrc(asMedia(poster)?.url)
    return (
      <video
        className={className}
        style={{ ...(fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : { width: '100%', height: 'auto' }), objectFit: fit, ...style }}
        src={src}
        poster={posterSrc}
        autoPlay={autoPlay}
        loop={loop}
        muted={autoPlay ? true : muted}
        controls={controls}
        playsInline
        preload={autoPlay ? 'auto' : 'metadata'}
        aria-label={alt ?? media.alt ?? undefined}
      />
    )
  }

  const common = {
    src,
    alt: alt ?? media.alt ?? '',
    className,
    priority,
    sizes,
    unoptimized: isSVG(media),
    style: { objectFit: fit, objectPosition: focalPosition(media), ...style } as CSSProperties,
  }
  if (fill || !media.width || !media.height) {
    return <NextImage {...common} fill />
  }
  return <NextImage {...common} width={media.width} height={media.height} style={{ ...common.style, width: '100%', height: 'auto' }} />
}

export type { MediaDoc }
