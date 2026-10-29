import { createHash } from 'crypto'
import type { Endpoint, PayloadRequest } from 'payload'

import { resolveWithFallback } from '@/i18n/fallback'
import { getFallbackChain, isLocale, type LocaleCode } from '@/i18n/locales'

/** Browsers keep strings 1 min; shared caches 5 min, then serve stale for a day while refreshing. */
export const I18N_CACHE_CONTROL = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'

type StringDoc = { key: string; value?: Partial<Record<string, string | null>> | string | null }

export type StringsPayload = {
  locale: LocaleCode
  namespace: string
  fallbackChain: LocaleCode[]
  strings: Record<string, string>
  /** Keys whose text came from a fallback locale, with the locale it came from. */
  inherited: Record<string, LocaleCode>
  missing: string[]
}

/** Pure: resolves every key along the fallback chain (ar-TN → ar → en). */
export const buildStrings = (docs: StringDoc[], locale: LocaleCode, namespace: string): StringsPayload => {
  const strings: Record<string, string> = {}
  const inherited: Record<string, LocaleCode> = {}
  const missing: string[] = []

  for (const doc of [...docs].sort((a, b) => a.key.localeCompare(b.key))) {
    const values = typeof doc.value === 'object' && doc.value !== null ? doc.value : {}
    const resolved = resolveWithFallback(values, locale)
    if (resolved.value === undefined || resolved.value === null) {
      missing.push(doc.key)
      continue
    }
    strings[doc.key] = resolved.value
    if (resolved.inherited && resolved.source) inherited[doc.key] = resolved.source
  }

  return { locale, namespace, fallbackChain: getFallbackChain(locale), strings, inherited, missing }
}

export const etagFor = (body: string) => `"${createHash('sha1').update(body).digest('base64url')}"`

export const i18nEndpoint: Endpoint = {
  path: '/i18n/:locale/:ns',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const locale = req.routeParams?.locale
    const namespace = req.routeParams?.ns

    if (!isLocale(locale)) {
      return Response.json({ error: `Unknown locale "${String(locale)}"` }, { status: 404 })
    }
    if (typeof namespace !== 'string' || !/^[a-z0-9-]+$/.test(namespace)) {
      return Response.json({ error: 'Invalid namespace' }, { status: 400 })
    }

    const { docs } = await req.payload.find({
      collection: 'translations',
      where: { namespace: { equals: namespace } },
      locale: 'all',
      pagination: false,
      depth: 0,
      select: { key: true, value: true },
      overrideAccess: false,
      req,
    })

    const body = JSON.stringify(buildStrings(docs as StringDoc[], locale, namespace))
    const etag = etagFor(body)
    const headers = {
      'Cache-Control': I18N_CACHE_CONTROL,
      ETag: etag,
      'Content-Type': 'application/json; charset=utf-8',
    }

    if (req.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers })
    }
    return new Response(body, { status: 200, headers })
  },
}
