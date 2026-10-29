import { unstable_cache } from 'next/cache'
import type { Payload } from 'payload'

import type { LocaleCode } from '@/i18n/locales'

import { TAGS } from './cacheTags'
import { computeSiteOverview, SITE_GLOBALS, type SiteOverview } from './siteOverview'

/** Saving a page, a media file, a form or a site global expires the cached overview (src/hooks/revalidate.ts). */
export const OVERVIEW_TAGS = [TAGS.pages, TAGS.media, TAGS.forms, ...SITE_GLOBALS.map(TAGS.global)]

/**
 * Dashboard data, cached per admin language. The 60 s expiry covers what has no tag
 * (form submissions, documents) and changes made outside Next.js (e.g. `pnpm seed`).
 */
export const getSiteOverview = async (
  payload: Payload,
  locale: LocaleCode,
  { fresh = false }: { fresh?: boolean } = {},
): Promise<SiteOverview> => {
  const compute = () => computeSiteOverview(payload, locale)
  if (fresh) return compute()
  try {
    return await unstable_cache(compute, ['site-overview', locale], { tags: OVERVIEW_TAGS, revalidate: 60 })()
  } catch {
    // Outside a Next.js request (scripts): no cache available.
    return compute()
  }
}
