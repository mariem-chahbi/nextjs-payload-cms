'use client'

import { FieldLabel, useDocumentInfo, useField, useLocale, useTranslation } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'

import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales'
import { TRANSLATION_STATUSES, type TranslationMeta, type TranslationStatus } from '@/translation/statusTypes'

import styles from './admin.module.css'
import { pick, StatusBadge, statusLabel, statusOf, TARGET_LOCALES } from './shared'

/**
 * Sidebar: status badges for every translation locale; in a translation locale, a picker to set it.
 * English edits flag "done" translations as "needs review" automatically (server hook).
 */
export const TranslationStatusField: JSONFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<TranslationMeta | null>({ path })
  const { code: locale } = useLocale()
  const { i18n } = useTranslation()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const lang = i18n.language
  const meta = value ?? {}
  const current = isLocale(locale) && locale !== DEFAULT_LOCALE ? locale : undefined
  const changed = current ? meta.locales?.[current]?.changed : undefined

  const translateURL = globalSlug
    ? `/admin/translate/global/${globalSlug}`
    : id
      ? `/admin/translate/collection/${collectionSlug}/${id}`
      : undefined

  return (
    <div className="field-type" style={{ marginBlockEnd: 'var(--base)' }}>
      <FieldLabel label={field.label} path={path} />
      <div style={{ display: 'grid', gap: 6 }}>
        {TARGET_LOCALES.map((l) => (
          <div key={l.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span>{pick(lang, l.label, l.nativeLabel)}</span>
            <StatusBadge status={statusOf(meta, l.code)} lang={lang} />
          </div>
        ))}
      </div>
      {current ? (
        <label style={{ display: 'grid', gap: 4, marginBlockStart: 10 }}>
          <span className={styles.muted}>{pick(lang, `Status for ${current}`, `الحالة لـ ${current}`)}</span>
          <select
            className={styles.select}
            value={statusOf(meta, current)}
            onChange={(e) =>
              setValue({
                ...meta,
                locales: { ...meta.locales, [current]: { ...meta.locales?.[current], status: e.target.value as TranslationStatus } },
              })
            }
          >
            {TRANSLATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s, lang)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className={styles.muted} style={{ marginBlockStart: 8 }}>
          {pick(lang, 'Switch to a translation locale to set its status.', 'انتقل إلى لغة الترجمة لتعيين حالتها.')}
        </p>
      )}
      {changed?.length ? (
        <p className={styles.muted} style={{ marginBlockStart: 6 }}>
          {pick(lang, 'English changed in:', 'تغيّر النص الإنجليزي في:')} {changed.slice(0, 4).join(', ')}
          {changed.length > 4 ? '…' : ''}
        </p>
      ) : null}
      {translateURL ? (
        <a href={`${translateURL}?target=${current ?? 'ar'}`} className={styles.button} style={{ display: 'inline-block', marginBlockStart: 10, textDecoration: 'none' }}>
          {pick(lang, 'Open translation view', 'فتح عرض الترجمة')}
        </a>
      ) : null}
    </div>
  )
}
