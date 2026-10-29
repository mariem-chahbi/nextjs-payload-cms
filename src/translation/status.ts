import type { Field, PayloadRequest } from 'payload'

import { DEFAULT_LOCALE, isLocale, type LocaleCode } from '@/i18n/locales'
import { l } from '@/i18n/labels'

import { collectTranslatable } from './fields'
import { hashFields, hashSource } from './hash'
import type { TranslationMeta, TranslationStatus } from './statusTypes'

/**
 * Translation status per locale, stored in ONE non-localized JSON field so a save in one locale
 * (English) can flag the others. Shape:
 *   { sourceHash, sourceFields: {path: hash}, locales: { ar: { status, basedOn, changed?, updatedAt } } }
 */
export { TRANSLATION_STATUSES } from './statusTypes'
export type { LocaleTranslationState, TranslationMeta, TranslationStatus } from './statusTypes'

export const TRANSLATION_FIELD = 'translation'

/** Sidebar field: badges for every locale + status picker for the current locale. */
export const translationStatusField = (): Field => ({
  name: TRANSLATION_FIELD,
  type: 'json',
  label: l('Translation status', 'حالة الترجمة'),
  // Translators may set the status of the locale they work in (see access/translator.ts).
  custom: { translatorEditable: true },
  admin: {
    position: 'sidebar',
    components: {
      Field: '/components/admin/TranslationStatusField#TranslationStatusField',
      Cell: '/components/admin/StatusBadgeCell#StatusBadgeCell',
    },
  },
})

type HookArgs = {
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  req: PayloadRequest
  context: Record<string, unknown>
}

/** Pure core of the hook (unit-tested). */
export const nextTranslationMeta = ({
  fields,
  previous,
  doc,
  locale,
  requestedStatus,
  now = new Date().toISOString(),
}: {
  fields: Field[]
  previous: TranslationMeta | undefined
  /** The document in `locale` after this save (original merged with incoming data). */
  doc: Record<string, unknown>
  locale: string | undefined
  requestedStatus?: TranslationStatus
  now?: string
}): TranslationMeta => {
  const meta: TranslationMeta = structuredClone(previous ?? {})
  meta.locales ??= {}

  if (!locale || locale === 'all') return meta

  if (locale === DEFAULT_LOCALE) {
    const entries = collectTranslatable(fields, doc)
    const hash = hashSource(entries)
    const fieldsNow = hashFields(entries)
    if (meta.sourceHash && meta.sourceHash !== hash) {
      const before = meta.sourceFields ?? {}
      const changed = Object.keys({ ...before, ...fieldsNow }).filter((p) => before[p] !== fieldsNow[p]).sort()
      for (const [code, state] of Object.entries(meta.locales)) {
        if (!state || state.status !== 'done') continue
        meta.locales[code as LocaleCode] = { ...state, status: 'needs-review', changed, updatedAt: now }
      }
    }
    meta.sourceHash = hash
    meta.sourceFields = fieldsNow
    return meta
  }

  if (!isLocale(locale)) return meta
  const current = meta.locales[locale]
  const hasContent = collectTranslatable(fields, doc).some((e) => e.translate && e.value !== undefined && e.value !== null && e.value !== '')
  const status: TranslationStatus = requestedStatus ?? current?.status ?? (hasContent ? 'needs-review' : 'missing')
  meta.locales[locale] = {
    status,
    basedOn: status === 'done' ? meta.sourceHash : current?.basedOn,
    changed: status === 'done' ? undefined : current?.changed,
    updatedAt: now,
  }
  return meta
}

/**
 * beforeChange: trust the stored meta, apply only the current locale's requested status, and when
 * English changes mark every "done" translation as "needs review".
 */
export const createTranslationStatusHook =
  (fields: Field[]) =>
  ({ data, originalDoc, req, context }: HookArgs) => {
    const incoming = data[TRANSLATION_FIELD] as TranslationMeta | undefined
    const locale = req.locale ?? undefined
    const forced = context.translationStatus as TranslationStatus | undefined
    const requested = forced ?? (isLocale(locale) ? incoming?.locales?.[locale]?.status : undefined)
    const previousStatus = isLocale(locale) ? (originalDoc?.[TRANSLATION_FIELD] as TranslationMeta | undefined)?.locales?.[locale]?.status : undefined

    data[TRANSLATION_FIELD] = nextTranslationMeta({
      fields,
      previous: originalDoc?.[TRANSLATION_FIELD] as TranslationMeta | undefined,
      doc: { ...(originalDoc ?? {}), ...data },
      locale,
      requestedStatus: requested && requested !== previousStatus ? requested : forced,
    })
    return data
  }
