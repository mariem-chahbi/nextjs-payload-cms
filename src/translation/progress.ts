import type { Field } from 'payload'

import { isEmptyValue } from '@/i18n/fallback'
import { getFallbackChain, getLanguage, type LocaleCode } from '@/i18n/locales'

import { collectTranslatable } from './fields'

export type LocaleProgress = {
  locale: LocaleCode
  total: number
  /** Texts the visitor sees in the right language (own value, or inherited from a same-language locale). */
  covered: number
  /** Texts stored in this locale itself (for region locales: the overrides). */
  own: number
  percent: number
}

/**
 * Coverage of one document. `valuesByLocale` = the document loaded in each locale without fallback.
 * Arabic locales only count Arabic text (falling back to English is not "translated");
 * English region locales may inherit from English.
 */
export const documentProgress = (
  fields: Field[],
  valuesByLocale: Partial<Record<LocaleCode, Record<string, unknown>>>,
  locales: LocaleCode[],
  sourceLocale: LocaleCode = 'en',
): { total: number; missingPaths: Partial<Record<LocaleCode, string[]>>; perLocale: Record<string, { covered: number; own: number }> } => {
  const source = collectTranslatable(fields, valuesByLocale[sourceLocale] ?? {}).filter((e) => e.translate && !isEmptyValue(e.value))
  const maps = Object.fromEntries(
    locales.map((l) => [l, new Map(collectTranslatable(fields, valuesByLocale[l] ?? {}).map((e) => [e.path, e.value]))]),
  ) as Record<LocaleCode, Map<string, unknown>>

  const perLocale: Record<string, { covered: number; own: number }> = {}
  const missingPaths: Partial<Record<LocaleCode, string[]>> = {}
  for (const locale of locales) {
    const sameLanguage = getFallbackChain(locale).filter((l) => getLanguage(l) === getLanguage(locale))
    let covered = 0
    let own = 0
    for (const entry of source) {
      if (!isEmptyValue(maps[locale]?.get(entry.path))) own++
      if (sameLanguage.some((l) => !isEmptyValue(maps[l]?.get(entry.path)))) covered++
      else (missingPaths[locale] ??= []).push(entry.path)
    }
    perLocale[locale] = { covered, own }
  }
  return { total: source.length, missingPaths, perLocale }
}

export const toPercent = (covered: number, total: number) => (total === 0 ? 100 : Math.floor((covered / total) * 100))
