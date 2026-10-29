/**
 * Single source of truth for content locales. No package imports: safe for server, client and proxy.
 *
 * A region locale (ar-TN, en-TN) stores only what differs; everything else is inherited through
 * `fallbackLocale`. Adding a brand-new locale code here needs a migration (see README).
 */
export const LOCALES = [
  { code: 'en', label: 'English', nativeLabel: 'English', rtl: false, language: 'en', fallbackLocale: [] },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', rtl: true, language: 'ar', fallbackLocale: ['en'] },
  {
    code: 'ar-TN',
    label: 'Arabic (Tunisia)',
    nativeLabel: 'العربية (تونس)',
    rtl: true,
    language: 'ar',
    fallbackLocale: ['ar', 'en'],
  },
  {
    code: 'en-TN',
    label: 'English (Tunisia)',
    nativeLabel: 'English (Tunisia)',
    rtl: false,
    language: 'en',
    fallbackLocale: ['en'],
  },
] as const satisfies readonly {
  code: string
  label: string
  nativeLabel: string
  rtl: boolean
  /** Base language, used for machine translation and the admin UI. */
  language: 'en' | 'ar'
  fallbackLocale: readonly string[]
}[]

export type LocaleCode = (typeof LOCALES)[number]['code']
export type Language = (typeof LOCALES)[number]['language']
export type LocaleDefinition = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: LocaleCode = 'en'
export const LOCALE_CODES = LOCALES.map((l) => l.code) as LocaleCode[]

export const isLocale = (value: unknown): value is LocaleCode =>
  typeof value === 'string' && (LOCALE_CODES as string[]).includes(value)

export const getLocaleDefinition = (code: LocaleCode): LocaleDefinition =>
  LOCALES.find((l) => l.code === code) ?? LOCALES[0]

export const isRTL = (code: string): boolean => isLocale(code) && getLocaleDefinition(code).rtl

export const getDirection = (code: string): 'rtl' | 'ltr' => (isRTL(code) ? 'rtl' : 'ltr')

export const getLanguage = (code: LocaleCode): Language => getLocaleDefinition(code).language

/** The locale itself followed by its fallbacks, e.g. ar-TN → ['ar-TN', 'ar', 'en']. */
export const getFallbackChain = (code: LocaleCode): LocaleCode[] => {
  const chain: LocaleCode[] = [code]
  for (const next of getLocaleDefinition(code).fallbackLocale as readonly LocaleCode[]) {
    if (!chain.includes(next)) chain.push(next)
  }
  if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE)
  return chain
}
