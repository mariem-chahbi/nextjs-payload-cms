import type { LocaleCode } from '@/i18n/locales'

/** Translation status values and shapes. No runtime imports: safe for admin client components. */
export const TRANSLATION_STATUSES = ['missing', 'needs-review', 'done'] as const
export type TranslationStatus = (typeof TRANSLATION_STATUSES)[number]

export type LocaleTranslationState = {
  status: TranslationStatus
  /** Source hash the translation was reviewed against. */
  basedOn?: string
  /** English fields that changed since then (paths). */
  changed?: string[]
  updatedAt?: string
}

export type TranslationMeta = {
  sourceHash?: string
  sourceFields?: Record<string, string>
  locales?: Partial<Record<LocaleCode, LocaleTranslationState>>
}
