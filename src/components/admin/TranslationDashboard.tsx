import Link from 'next/link'
import type { Payload } from 'payload'

import { getLocaleDefinition, LOCALES, type LocaleCode } from '@/i18n/locales'
import { getTranslationProgress } from '@/translation/progressCache'

import styles from './admin.module.css'
import { pick, StatusBadges } from './shared'

type ProgressProps = { payload: Payload; lang?: string; fresh?: boolean; refreshHref: string }

const loadReport = async (payload: Payload, fresh: boolean) => {
  try {
    return { report: await getTranslationProgress(payload, { fresh }) }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

const isRegional = (locale: LocaleCode) => {
  const def = getLocaleDefinition(locale)
  return def.fallbackLocale.length > 1 || (def.language === 'en' && locale !== 'en')
}

/**
 * Full translation report: % translated per locale over pages, globals and UI strings, with links to
 * what is missing. Arabic counts only Arabic text; region locales count inherited text.
 */
export async function TranslationProgress({ payload, lang, fresh = false, refreshHref }: ProgressProps) {
  // Cached and refreshed on every content save; ?refresh=1 recalculates now.
  const { report, error } = await loadReport(payload, fresh)
  if (!report) return <p className={`${styles.notice} ${styles.error}`}>{error}</p>
  const updated = new Date(report.generatedAt).toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB')

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{pick(lang, 'Translation progress', 'تقدم الترجمة')}</h2>
        <span className={styles.muted}>
          {pick(lang, 'Updated', 'آخر تحديث')} {updated} · <Link href={refreshHref}>{pick(lang, 'Recalculate', 'إعادة الحساب')}</Link>
        </span>
      </div>
      <div className={styles.progress}>
        {report.locales.map((p) => {
          const def = getLocaleDefinition(p.locale)
          return (
            <div key={p.locale} className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>
                  {pick(lang, def.label, def.nativeLabel)} <span className={styles.muted}>{p.locale}</span>
                </strong>
                <span className={styles.percent}>{p.percent}%</span>
              </div>
              <div className={styles.bar}>
                <div className={styles.barFill} style={{ inlineSize: `${p.percent}%` }} />
              </div>
              <span className={styles.muted}>
                {p.covered} / {p.total} {pick(lang, 'texts', 'نص')}
                {isRegional(p.locale) ? ` · ${p.own} ${pick(lang, 'regional overrides', 'تخصيصات محلية')}` : ''}
              </span>
            </div>
          )
        })}
      </div>

      {report.documents.length ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{pick(lang, 'Needs work', 'يحتاج عملًا')}</th>
              <th>{pick(lang, 'Status', 'الحالة')}</th>
              {LOCALES.filter((l) => l.code !== 'en').map((l) => (
                <th key={l.code}>
                  {pick(lang, 'Missing', 'ناقص')} {l.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.documents.map((doc) => (
              <tr key={doc.entity}>
                <td>{doc.title}</td>
                <td>
                  <StatusBadges meta={{ locales: doc.status }} lang={lang} />
                </td>
                {LOCALES.filter((l) => l.code !== 'en').map((l) => (
                  <td key={l.code}>
                    {doc.missing[l.code] ? <a href={`${doc.editURL}?target=${l.code}`}>{doc.missing[l.code]} →</a> : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={`${styles.notice} ${styles.success}`}>{pick(lang, 'Everything is translated and reviewed.', 'كل شيء مترجم ومراجع.')}</p>
      )}
    </section>
  )
}

/** One-line translation card for the content dashboard; the full report has its own page. */
export async function TranslationSummary({ payload, lang }: { payload: Payload; lang?: string }) {
  const { report } = await loadReport(payload, false)
  if (!report) return null
  return (
    <section className={styles.section}>
      <div className={`${styles.card} ${styles.summary}`}>
        <strong>{pick(lang, 'Translations', 'الترجمات')}</strong>
        <span className={styles.chips}>
          {report.locales.map((p) => (
            <span key={p.locale} className={styles.chip}>
              {p.locale} <strong>{p.percent}%</strong>
            </span>
          ))}
        </span>
        <span className={styles.muted}>
          {report.documents.length
            ? `${report.documents.length} ${pick(lang, 'items need work', 'عناصر تحتاج عملًا')}`
            : pick(lang, 'All translated', 'كل شيء مترجم')}
        </span>
        <Link href="/admin/translation-progress" className={styles.summaryLink}>
          {pick(lang, 'Translation progress →', 'تقدم الترجمة ←')}
        </Link>
      </div>
    </section>
  )
}
