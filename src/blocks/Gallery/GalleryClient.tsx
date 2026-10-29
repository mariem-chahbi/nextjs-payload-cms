'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'

import { ImageFrame } from '@/components/site/ImageFrame'
import { Media } from '@/components/site/Media'
import type { Media as MediaDoc } from '@/payload-types'

type Item = { id?: string; image: MediaDoc; caption?: string }

/** Grid or scroll-snap slider, with an accessible lightbox (Esc, arrow keys follow reading direction). */
export function GalleryClient({
  images,
  layout,
  lightbox,
  ratio,
  fit,
  style,
  labels,
}: {
  images: Item[]
  layout: string
  lightbox: boolean
  ratio: string
  fit: 'cover' | 'contain'
  style: CSSProperties
  labels: { close: string; previous: string; next: string }
}) {
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const step = useCallback((delta: number) => setOpen((i) => (i === null ? i : (i + delta + images.length) % images.length)), [images.length])

  useEffect(() => {
    if (open === null) return
    const rtl = document.documentElement.dir === 'rtl'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(rtl ? -1 : 1)
      if (e.key === 'ArrowLeft') step(rtl ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, step])

  const current = open === null ? undefined : images[open]

  return (
    <>
      <div className={`gallery gallery-${layout}`} style={style}>
        {images.map((item, i) => (
          <figure key={item.id ?? i} className="gallery-item">
            {lightbox ? (
              <button type="button" className="gallery-open" onClick={() => setOpen(i)} aria-label={item.caption ?? item.image.alt ?? ''}>
                <ImageFrame className="gallery-thumb" media={item.image} ratio={ratio} fit={fit} sizes="(min-width: 1024px) 33vw, 100vw" />
              </button>
            ) : (
              <ImageFrame className="gallery-thumb" media={item.image} ratio={ratio} fit={fit} sizes="(min-width: 1024px) 33vw, 100vw" />
            )}
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
      {current ? (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={close}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <Media media={current.image} sizes="100vw" fit="contain" />
            {current.caption ? <p className="lightbox-caption">{current.caption}</p> : null}
          </div>
          <button type="button" className="lightbox-btn lightbox-close" onClick={close} aria-label={labels.close}>
            ✕
          </button>
          {images.length > 1 ? (
            <>
              <button type="button" className="lightbox-btn lightbox-prev" onClick={(e) => (e.stopPropagation(), step(-1))} aria-label={labels.previous}>
                <span className="icon-mirror">‹</span>
              </button>
              <button type="button" className="lightbox-btn lightbox-next" onClick={(e) => (e.stopPropagation(), step(1))} aria-label={labels.next}>
                <span className="icon-mirror">›</span>
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
