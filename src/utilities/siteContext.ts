import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'

import type { RenderContext } from '@/blocks/types'
import { getDirection, type LocaleCode } from '@/i18n/locales'
import { resolveRegion } from '@/i18n/regions'

import { getGlobal, getRegions, getUIStrings } from './data'
import { REGION_COOKIE } from './getLocale'

/** Everything blocks and chrome need for one request: locale, direction, region, home page, UI strings. */
export const getSiteContext = cache(async (locale: LocaleCode): Promise<RenderContext & { regions: Awaited<ReturnType<typeof getRegions>> }> => {
  const [regions, settings, strings, cookieStore] = await Promise.all([
    getRegions(),
    getGlobal('site-settings', locale),
    getUIStrings(locale, 'common'),
    cookies(),
  ])
  const region = resolveRegion(regions as never[], locale, cookieStore.get(REGION_COOKIE)?.value) as RenderContext['region']
  const home = settings.homePage
  return {
    locale,
    dir: getDirection(locale),
    region,
    regions,
    homePageId: typeof home === 'object' && home ? home.id : (home ?? null),
    strings,
  }
})
