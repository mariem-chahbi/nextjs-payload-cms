import type { RegionLike } from './regions'

/**
 * Intl formatting driven by the visitor's region: digits (Latin / Arabic-Indic), currency,
 * date style and time zone. No package imports.
 */
export const intlLocaleFor = (locale: string, region?: RegionLike | null): string =>
  `${locale}-u-nu-${region?.numberFormat === 'arab' ? 'arab' : 'latn'}`

export type NumberStyle = 'number' | 'compact' | 'percent' | 'currency'

export const formatNumber = (
  value: number,
  { locale, region, style = 'number', decimals = 0 }: { locale: string; region?: RegionLike | null; style?: NumberStyle; decimals?: number },
): string => {
  const options: Intl.NumberFormatOptions = { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
  if (style === 'compact') {
    options.notation = 'compact'
    options.maximumFractionDigits = Math.max(decimals, 1)
    options.minimumFractionDigits = 0
  }
  if (style === 'percent') options.style = 'percent'
  if (style === 'currency') {
    options.style = 'currency'
    options.currency = region?.currency || 'USD'
  }
  return new Intl.NumberFormat(intlLocaleFor(locale, region), options).format(style === 'percent' ? value / 100 : value)
}

export const formatDate = (
  date: Date | string | number,
  { locale, region }: { locale: string; region?: RegionLike | null },
): string =>
  new Intl.DateTimeFormat(intlLocaleFor(locale, region), {
    dateStyle: region?.dateFormat ?? 'long',
    timeZone: region?.timezone || 'UTC',
  }).format(new Date(date))
