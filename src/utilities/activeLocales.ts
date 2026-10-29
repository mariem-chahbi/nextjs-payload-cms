import { unstable_cache } from 'next/cache'
import type { Payload } from 'payload'

import { DEFAULT_LOCALE } from '@/i18n/locales'
import { localesFromRegions, type RegionLike } from '@/i18n/regions'

import { TAGS } from './cacheTags'

/**
 * Locales of the active regions (admin locale selector). Called on every admin request, so it is
 * cached and expired when a region changes (Regions afterChange/afterDelete → TAGS.regions).
 */
export const getActiveRegionLocales = async (payload: Payload): Promise<string[]> => {
  const load = async () => {
    const { docs } = await payload.find({
      collection: 'regions',
      where: { active: { equals: true } },
      pagination: false,
      depth: 0,
      locale: DEFAULT_LOCALE,
      select: { locales: true, active: true, code: true, sortOrder: true },
    })
    return localesFromRegions(docs as unknown as RegionLike[])
  }
  try {
    return await unstable_cache(load, ['active-region-locales'], { tags: [TAGS.regions], revalidate: 300 })()
  } catch {
    // Outside a Next.js request (CLI, seed): no cache available.
    return load()
  }
}
