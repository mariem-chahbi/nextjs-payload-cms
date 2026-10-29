import type { Media } from '@/payload-types'

export type MediaRef = Media | number | string | null | undefined

export const asMedia = (value: MediaRef): Media | undefined =>
  value && typeof value === 'object' && 'url' in value ? value : undefined

export const isVideo = (media: Media | undefined): boolean => Boolean(media?.mimeType?.startsWith('video/'))
export const isSVG = (media: Media | undefined): boolean => media?.mimeType === 'image/svg+xml'

/**
 * Payload returns absolute URLs on the configured server URL. Keep them relative so next/image
 * treats them as local images (served by /api/media/file/..., which applies access control).
 */
export const mediaSrc = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined
  try {
    const parsed = new URL(url, 'http://local')
    if (parsed.pathname.startsWith('/api/')) return `${parsed.pathname}${parsed.search}`
    return url
  } catch {
    return url
  }
}

/** CSS object-position from the focal point chosen in the admin (defaults to center). */
export const focalPosition = (media: Media | undefined): string =>
  `${media?.focalX ?? 50}% ${media?.focalY ?? 50}%`
