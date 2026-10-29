import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from '@/i18n/locales'
import type { TranslationMeta, TranslationStatus } from '@/translation/statusTypes'

import styles from './admin.module.css'

/** Admin chrome text in the admin language (en / ar). */
export const pick = (lang: string | undefined, en: string, ar: string) => (lang === 'ar' ? ar : en)

export const TARGET_LOCALES = LOCALES.filter((l) => l.code !== DEFAULT_LOCALE)

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "5 minutes ago" / "منذ 5 دقائق" (Latin digits, like the rest of the admin). */
export const timeAgo = (iso: string | null | undefined, lang?: string, now = Date.now()): string => {
  if (!iso) return '—'
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const format = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en', { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(0, 'minute')
}

const STATUS_LABEL: Record<TranslationStatus, [string, string]> = {
  missing: ['missing', 'ناقصة'],
  'needs-review': ['needs review', 'تحتاج مراجعة'],
  done: ['done', 'مكتملة'],
}

export const statusLabel = (status: TranslationStatus, lang?: string) => pick(lang, ...STATUS_LABEL[status])

export const statusOf = (meta: TranslationMeta | null | undefined, locale: LocaleCode): TranslationStatus =>
  meta?.locales?.[locale]?.status ?? 'missing'

export function StatusBadge({ status, locale, lang, title }: { status: TranslationStatus; locale?: string; lang?: string; title?: string }) {
  return (
    <span className={`${styles.badge} ${styles[`badge-${status}`]}`} title={title}>
      {locale ? <strong>{locale}</strong> : null}
      {statusLabel(status, lang)}
    </span>
  )
}

export function StatusBadges({ meta, lang }: { meta: TranslationMeta | null | undefined; lang?: string }) {
  return (
    <span className={styles.badges}>
      {TARGET_LOCALES.map((l) => (
        <StatusBadge key={l.code} status={statusOf(meta, l.code)} locale={l.code} lang={lang} />
      ))}
    </span>
  )
}
