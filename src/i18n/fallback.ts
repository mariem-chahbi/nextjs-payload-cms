import { getFallbackChain, type LocaleCode } from './locales'

export type ResolvedValue<T> = {
  value: T | undefined
  /** Locale the value actually came from; undefined when missing everywhere in the chain. */
  source: LocaleCode | undefined
  /** True when the value came from a fallback locale rather than the requested one. */
  inherited: boolean
}

export const isEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object' && 'root' in (value as Record<string, unknown>)) {
    // Lexical: empty when the root holds no text at all.
    return !JSON.stringify(value).includes('"text":"')
  }
  return false
}

/**
 * Resolves one localized value along the fallback chain
 * (ar-TN → ar → en, en-TN → en), given the value of every locale (`locale: 'all'`).
 */
export const resolveWithFallback = <T>(
  valuesByLocale: Partial<Record<string, T>> | null | undefined,
  locale: LocaleCode,
): ResolvedValue<T> => {
  for (const candidate of getFallbackChain(locale)) {
    const value = valuesByLocale?.[candidate]
    if (!isEmptyValue(value)) {
      return { value, source: candidate, inherited: candidate !== locale }
    }
  }
  return { value: undefined, source: undefined, inherited: false }
}
