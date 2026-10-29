import { unstable_cache } from 'next/cache'
import type { Payload, PayloadRequest } from 'payload'

import { TAGS } from '@/utilities/cacheTags'

import { TRANSLATABLE_GLOBALS } from './entities'
import { computeProgress, type ProgressReport } from './service'

/** Saving a page, a UI string or a translatable global expires the cached report (src/hooks/revalidate.ts). */
export const PROGRESS_TAGS = [TAGS.pages, TAGS.translations, ...TRANSLATABLE_GLOBALS.map(TAGS.global)]

/**
 * Dashboard data, cached. Computed with system access (the same numbers for every panel user;
 * only admin-panel users ever see it). The 60 s expiry covers changes made outside Next.js
 * (e.g. `pnpm seed`), which cannot expire tags.
 */
export const getTranslationProgress = async (payload: Payload, { fresh = false }: { fresh?: boolean } = {}): Promise<ProgressReport> => {
  const compute = () => computeProgress(payload, { user: null, payload } as unknown as PayloadRequest, { overrideAccess: true })
  if (fresh) return compute()
  try {
    return await unstable_cache(compute, ['translation-progress'], { tags: PROGRESS_TAGS, revalidate: 60 })()
  } catch {
    // Outside a Next.js request (scripts): no cache available.
    return compute()
  }
}
