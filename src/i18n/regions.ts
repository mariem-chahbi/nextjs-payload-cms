import { DEFAULT_LOCALE, isLocale, LOCALE_CODES, type LocaleCode } from './locales'

/** The subset of a Region document the site and the admin need. No package imports. */
export type RegionLike = {
  code: string
  name?: string | null
  active?: boolean | null
  locales?: string[] | null
  defaultLocale?: string | null
  currency?: string | null
  dateFormat?: 'short' | 'medium' | 'long' | 'full' | null
  numberFormat?: 'latn' | 'arab' | null
  timezone?: string | null
  sortOrder?: number | null
}

export const activeRegions = <T extends RegionLike>(regions: readonly T[]): T[] =>
  regions
    .filter((r) => r.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.code.localeCompare(b.code))

/**
 * Locales offered in the admin locale selector and the site switcher: the union of every active
 * region's locales, in config order. The default locale is always kept so editing never locks out.
 */
export const localesFromRegions = (regions: readonly RegionLike[]): LocaleCode[] => {
  const used = new Set<string>([DEFAULT_LOCALE])
  for (const region of activeRegions(regions)) {
    for (const code of region.locales ?? []) used.add(code)
  }
  return LOCALE_CODES.filter((code) => used.has(code))
}

/**
 * Which region a visitor is in, from the URL locale and the remembered region (cookie).
 * Several regions may share a locale (e.g. a new region reusing `ar`), so the cookie wins when that
 * region offers the locale; otherwise the first active region offering it.
 */
export const resolveRegion = <T extends RegionLike>(
  regions: readonly T[],
  locale: string,
  preferredRegionCode?: string | null,
): T | undefined => {
  const candidates = activeRegions(regions).filter((r) => (r.locales ?? []).includes(locale))
  return candidates.find((r) => r.code === preferredRegionCode) ?? candidates[0]
}

/** Default locale of a region, guaranteed to be one of its locales. */
export const regionDefaultLocale = (region: RegionLike): LocaleCode => {
  const locales = (region.locales ?? []).filter(isLocale)
  if (region.defaultLocale && isLocale(region.defaultLocale) && locales.includes(region.defaultLocale)) {
    return region.defaultLocale
  }
  return locales[0] ?? DEFAULT_LOCALE
}

/** "Show in regions" on a block: empty means everywhere. */
export const isVisibleInRegion = (
  showInRegions: readonly (string | { code?: string | null } | number | null | undefined)[] | null | undefined,
  regionCode: string | undefined,
): boolean => {
  if (!showInRegions || showInRegions.length === 0) return true
  if (!regionCode) return false
  return showInRegions.some((entry) =>
    typeof entry === 'object' && entry !== null ? entry.code === regionCode : entry === regionCode,
  )
}
