import { Media } from '@/components/site/Media'
import type { VideoBlock as VideoBlockData } from '@/payload-types'

import type { RenderContext } from '../types'

/** YouTube / Vimeo URL → privacy-friendly embed URL with the chosen playback options. */
export const embedURL = (source: string, url: string, opts: { autoplay?: boolean | null; loop?: boolean | null; muted?: boolean | null; controls?: boolean | null }) => {
  if (source === 'youtube') {
    const id = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1]
    if (!id) return undefined
    const params = new URLSearchParams({
      autoplay: opts.autoplay ? '1' : '0',
      mute: opts.muted || opts.autoplay ? '1' : '0',
      controls: opts.controls === false ? '0' : '1',
      rel: '0',
      ...(opts.loop ? { loop: '1', playlist: id } : {}),
    })
    return `https://www.youtube-nocookie.com/embed/${id}?${params}`
  }
  if (source === 'vimeo') {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
    if (!id) return undefined
    const params = new URLSearchParams({
      autoplay: opts.autoplay ? '1' : '0',
      muted: opts.muted || opts.autoplay ? '1' : '0',
      loop: opts.loop ? '1' : '0',
      controls: opts.controls === false ? '0' : '1',
      dnt: '1',
    })
    return `https://player.vimeo.com/video/${id}?${params}`
  }
  return undefined
}

export function VideoComponent({ block }: { block: VideoBlockData; ctx: RenderContext }) {
  const ratio = block.aspectRatio ?? '16/9'
  const source = block.source ?? 'upload'
  const embed = source !== 'upload' && block.url ? embedURL(source, block.url, block) : undefined
  return (
    <figure className="video-block">
      <div className="video-frame" style={{ aspectRatio: ratio }}>
        {source === 'upload' ? (
          <Media
            media={block.video}
            poster={block.poster}
            fill
            fit="cover"
            autoPlay={Boolean(block.autoplay)}
            loop={Boolean(block.loop)}
            muted={Boolean(block.muted)}
            controls={block.controls !== false}
          />
        ) : embed ? (
          <iframe
            src={embed}
            title={block.caption ?? 'Video'}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : null}
      </div>
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  )
}
