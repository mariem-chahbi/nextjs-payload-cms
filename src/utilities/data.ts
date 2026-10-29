import 'server-only'

import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import type { Where } from 'payload'
import { cache } from 'react'

import { buildStrings } from '@/endpoints/i18n'
import { DEFAULT_LOCALE, getFallbackChain, LOCALE_CODES, type LocaleCode } from '@/i18n/locales'
import type { Footer, Header, Page, Region, SiteSetting, Theme } from '@/payload-types'

import { TAGS } from './cacheTags'
import { getPayload } from './getPayload'

/**
 * Site data, read through the Local API.
 *  - Published reads are cached and tagged; afterChange hooks expire the tags (src/hooks/revalidate.ts).
 *  - In draft mode (preview / Live Preview) everything is read fresh, drafts included.
 */
const isDraft = cache(async () => (await draftMode()).isEnabled)

type GlobalMap = { 'site-settings': SiteSetting; theme: Theme; header: Header; footer: Footer }

const readGlobal = async <S extends keyof GlobalMap>(slug: S, locale: LocaleCode, draft: boolean): Promise<GlobalMap[S]> => {
  const payload = await getPayload()
  return (await payload.findGlobal({ slug, locale, depth: 2, draft, overrideAccess: draft })) as GlobalMap[S]
}

export const getGlobal = cache(async <S extends keyof GlobalMap>(slug: S, locale: LocaleCode): Promise<GlobalMap[S]> => {
  if (await isDraft()) return readGlobal(slug, locale, true)
  return unstable_cache(() => readGlobal(slug, locale, false), ['global', slug, locale], {
    tags: [TAGS.global(slug), TAGS.pages, TAGS.media],
  })()
})

export const getRegions = cache(async (): Promise<Region[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'regions',
        where: { active: { equals: true } },
        sort: 'sortOrder',
        locale: 'all',
        pagination: false,
        depth: 0,
      })
      return docs as Region[]
    },
    ['regions'],
    { tags: [TAGS.regions] },
  )(),
)

const findPageIdByPath = async (path: string, locale: LocaleCode, draft: boolean) => {
  const payload = await getPayload()
  // A page may have no slug of its own in this locale (inherited): try the fallback chain.
  for (const candidate of getFallbackChain(locale)) {
    const where: Where = { path: { equals: path } }
    const { docs } = await payload.find({
      collection: 'pages',
      where,
      locale: candidate,
      depth: 0,
      limit: 1,
      pagination: false,
      draft,
      overrideAccess: draft,
    })
    if (docs[0]) return docs[0].id
  }
  // Last resort: the URL uses another language's slug (e.g. after switching language). Serve the page anyway.
  for (const candidate of LOCALE_CODES.filter((code) => !getFallbackChain(locale).includes(code))) {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { path: { equals: path } },
      locale: candidate,
      depth: 0,
      limit: 1,
      pagination: false,
      draft,
      overrideAccess: draft,
    })
    if (docs[0]) return docs[0].id
  }
  return undefined
}

const readPage = async (id: number | string, locale: LocaleCode, draft: boolean): Promise<Page | null> => {
  const payload = await getPayload()
  try {
    return (await payload.findByID({ collection: 'pages', id, locale, depth: 2, draft, overrideAccess: draft })) as Page
  } catch {
    return null
  }
}

/** Page for a URL path ('' = the home page from Site settings). */
export const getPageByPath = cache(async (path: string, locale: LocaleCode): Promise<Page | null> => {
  const draft = await isDraft()
  const load = async () => {
    let id: number | string | undefined
    if (path === '') {
      const settings = await readGlobal('site-settings', locale, draft)
      const home = settings.homePage
      id = typeof home === 'object' && home ? home.id : (home ?? undefined)
    } else {
      id = await findPageIdByPath(path, locale, draft)
    }
    return id === undefined ? null : readPage(id, locale, draft)
  }
  if (draft) return load()
  return unstable_cache(load, ['page', locale, path], { tags: [TAGS.pages, TAGS.media, TAGS.global('site-settings')] })()
})

/** URL path of a page in every locale (for hreflang alternates), with fallback to inherited paths. */
export const getPagePaths = cache(async (id: number | string): Promise<Partial<Record<LocaleCode, string>>> =>
  unstable_cache(
    async () => {
      const payload = await getPayload()
      const doc = await payload.findByID({ collection: 'pages', id, locale: 'all', depth: 0, select: { path: true } as never })
      const raw = ((doc as { path?: Record<string, string | null> }).path ?? {}) as Record<string, string | null>
      const out: Partial<Record<LocaleCode, string>> = {}
      for (const locale of Object.keys(raw) as LocaleCode[]) out[locale] = raw[locale] ?? undefined
      return out
    },
    ['page-paths', String(id)],
    { tags: [TAGS.pages] },
  )(),
)

/** UI strings for a namespace, resolved along the fallback chain. */
export const getUIStrings = cache(async (locale: LocaleCode, namespace = 'common'): Promise<Record<string, string>> =>
  unstable_cache(
    async () => {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'translations',
        where: { namespace: { equals: namespace } },
        locale: 'all',
        pagination: false,
        depth: 0,
      })
      return buildStrings(docs as never, locale, namespace).strings
    },
    ['ui-strings', locale, namespace],
    { tags: [TAGS.translations] },
  )(),
)

/** `t('nav.home', 'Home')`: UI string with a code-side default for missing keys. */
export const getTranslator = async (locale: LocaleCode, namespace = 'common') => {
  const strings = await getUIStrings(locale, namespace)
  return (key: string, fallback?: string) => strings[key] ?? fallback ?? key
}

export { DEFAULT_LOCALE }
