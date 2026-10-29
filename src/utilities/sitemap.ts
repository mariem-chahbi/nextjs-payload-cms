import type { MetadataRoute } from 'next'

import { resolveWithFallback } from '@/i18n/fallback'
import { DEFAULT_LOCALE, type LocaleCode } from '@/i18n/locales'

export type SitemapPage = {
  id: number | string
  path?: Partial<Record<string, string | null>> | null
  updatedAt?: string | null
}

/**
 * One entry per page and active locale, each listing every language version (hreflang).
 * A locale without its own slug uses the inherited path (ar-TN → ar → en).
 */
export const buildSitemapEntries = (
  pages: SitemapPage[],
  locales: LocaleCode[],
  baseURL: string,
  homePageId?: number | string | null,
): MetadataRoute.Sitemap => {
  const base = baseURL.replace(/\/+$/, '')
  const entries: MetadataRoute.Sitemap = []

  for (const page of pages) {
    const isHome = homePageId !== undefined && homePageId !== null && String(page.id) === String(homePageId)
    const urlFor = (locale: LocaleCode): string | undefined => {
      if (isHome) return `${base}/${locale}`
      const path = resolveWithFallback(page.path ?? {}, locale).value
      return path ? `${base}/${locale}/${path}` : undefined
    }
    const languages: Record<string, string> = {}
    for (const locale of locales) {
      const url = urlFor(locale)
      if (url) languages[locale] = url
    }
    const xDefault = languages[DEFAULT_LOCALE] ?? Object.values(languages)[0]
    if (xDefault) languages['x-default'] = xDefault

    for (const locale of locales) {
      const url = languages[locale]
      if (!url) continue
      entries.push({
        url,
        lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
        changeFrequency: 'weekly',
        priority: isHome ? 1 : 0.7,
        alternates: { languages },
      })
    }
  }
  return entries
}
