import { DEFAULT_LOCALE, getDirection, isLocale, LOCALE_CODES, type LocaleCode } from '@/i18n/locales'

/** Cookies shared by the proxy (first visit) and the Region + Language switcher. */
export const LOCALE_COOKIE = 'pp-locale'
export const REGION_COOKIE = 'pp-region'
/** Request header set by the proxy so not-found pages (which get no params) know the locale. */
export const LOCALE_HEADER = 'x-pp-locale'
export const ONE_YEAR = 60 * 60 * 24 * 365

/** Case-insensitive match against configured codes: "ar-tn" → "ar-TN". */
export const normalizeLocale = (value: string | null | undefined): LocaleCode | undefined => {
  if (!value) return undefined
  const lower = value.toLowerCase()
  return LOCALE_CODES.find((code) => code.toLowerCase() === lower)
}

/** "ar-TN,ar;q=0.9,en;q=0.8" → ['ar-TN', 'ar', 'en'] sorted by quality. */
export const parseAcceptLanguage = (header: string | null | undefined): string[] =>
  (header ?? '')
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { tag: tag?.trim() ?? '', q: q ? Number(q.slice(2)) || 0 : 1, index }
    })
    .filter((entry) => entry.tag && entry.tag !== '*' && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((entry) => entry.tag)

/**
 * Locale for a visitor without a locale in the URL: remembered choice first, then the browser's
 * languages (exact code, then base language), then the default.
 */
export const negotiateLocale = ({
  cookie,
  acceptLanguage,
}: {
  cookie?: string | null
  acceptLanguage?: string | null
}): LocaleCode => {
  const remembered = normalizeLocale(cookie)
  if (remembered) return remembered

  for (const tag of parseAcceptLanguage(acceptLanguage)) {
    const exact = normalizeLocale(tag)
    if (exact) return exact
    const base = normalizeLocale(tag.split('-')[0])
    if (base) return base
  }
  return DEFAULT_LOCALE
}

/** Validates the [locale] route param. */
export const getLocaleFromParam = (value: unknown): { locale: LocaleCode; dir: 'rtl' | 'ltr' } | undefined =>
  isLocale(value) ? { locale: value, dir: getDirection(value) } : undefined
