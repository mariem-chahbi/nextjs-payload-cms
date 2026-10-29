import type { LocaleCode } from '@/i18n/locales'

type PageRef = { id?: number | string; path?: string | null; slug?: string | null } | number | string | null | undefined

export type LinkData = {
  type?: 'page' | 'url' | null
  page?: PageRef
  url?: string | null
  newTab?: boolean | null
}

/** Site URL of a page in a locale: "/ar/about-us". The home page is "/ar". */
export const pageHref = (page: PageRef, locale: LocaleCode, homePageId?: number | string | null): string => {
  if (!page || typeof page !== 'object') return `/${locale}`
  if (homePageId !== undefined && homePageId !== null && String(page.id) === String(homePageId)) return `/${locale}`
  const path = page.path ?? page.slug ?? ''
  return path ? `/${locale}/${path}` : `/${locale}`
}

/** href for a link field group; internal pages follow the locale. Empty URLs become undefined. */
export const linkHref = (link: LinkData | null | undefined, locale: LocaleCode, homePageId?: number | string | null) => {
  if (!link) return undefined
  if (link.type === 'url') return link.url || undefined
  if (link.page) return pageHref(link.page, locale, homePageId)
  return undefined
}

export const isExternalHref = (href: string) => /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
