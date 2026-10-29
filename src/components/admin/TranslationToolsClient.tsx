'use client'

import { useState, type FormEvent } from 'react'

import { LOCALES } from '@/i18n/locales'

import styles from './admin.module.css'
import { pick } from './shared'

type Report = { locale: string; applied: number; documents: number; problems: { row: number; key: string; message: string }[] }

export function TranslationToolsClient({ lang, canPublish }: { lang: string; canPublish: boolean }) {
  const [locale, setLocale] = useState('ar')
  const [format, setFormat] = useState('csv')
  const [missingOnly, setMissingOnly] = useState(false)
  const [report, setReport] = useState<Report>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const exportHref = `/api/translation/export?locale=${locale}&format=${format}${missingOnly ? '&missingOnly=1' : ''}`

  const onImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setReport(undefined)
    setError(undefined)
    try {
      const res = await fetch('/api/translation/import', { method: 'POST', credentials: 'include', body: new FormData(event.currentTarget) })
      const body = (await res.json()) as Report & { error?: string }
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      setReport(body)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24, maxInlineSize: 900 }}>
      <section className={styles.card}>
        <h2>{pick(lang, '1. Export', '١. تصدير')}</h2>
        <p className={styles.muted}>
          {pick(
            lang,
            'One row per text: key, context, source text and the current translation. Rich text is split into one row per text segment, so formatting is kept on import. CSV is UTF-8 with BOM: Excel shows Arabic correctly.',
            'صف لكل نص: المفتاح والسياق والنص المصدر والترجمة الحالية. يُقسم النص المنسق إلى صف لكل مقطع فيبقى التنسيق عند الاستيراد. ملف CSV بترميز UTF-8 مع BOM ليظهر النص العربي في Excel بشكل صحيح.',
          )}
        </p>
        <div className={styles.toolbar}>
          <select className={styles.select} value={locale} onChange={(e) => setLocale(e.target.value)}>
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel} ({l.code})
              </option>
            ))}
          </select>
          <select className={styles.select} value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="csv">CSV (Excel)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
          </select>
          <label className={styles.toolbar}>
            <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
            {pick(lang, 'Missing only', 'الناقصة فقط')}
          </label>
          <a className={`${styles.button} ${styles.primary}`} href={exportHref} style={{ textDecoration: 'none' }}>
            ⬇ {pick(lang, 'Download', 'تنزيل')}
          </a>
        </div>
      </section>

      <section className={styles.card}>
        <h2>{pick(lang, '2. Import', '٢. استيراد')}</h2>
        <p className={styles.muted}>
          {pick(
            lang,
            'Edit only the "target" column and keep "key" as exported. Empty cells are ignored. Every key is checked; problems are listed below with their row number.',
            'عدّل عمود "target" فقط واترك "key" كما هو. تُتجاهل الخانات الفارغة. يُتحقق من كل مفتاح وتُعرض المشاكل مع رقم الصف.',
          )}
        </p>
        <form className={styles.toolbar} onSubmit={onImport}>
          <select className={styles.select} name="locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel} ({l.code})
              </option>
            ))}
          </select>
          <input className={styles.input} style={{ maxInlineSize: 320 }} type="file" name="file" accept=".csv,.xlsx,.json" required />
          {canPublish ? (
            <label className={styles.toolbar}>
              <input type="checkbox" name="publish" value="1" defaultChecked />
              {pick(lang, 'Publish (update the site now)', 'نشر (تحديث الموقع الآن)')}
            </label>
          ) : (
            <span className={styles.muted}>{pick(lang, 'Saved as drafts for review.', 'تُحفظ كمسودات للمراجعة.')}</span>
          )}
          <button className={`${styles.button} ${styles.primary}`} type="submit" disabled={busy}>
            {busy ? '…' : `⬆ ${pick(lang, 'Import', 'استيراد')}`}
          </button>
        </form>
        {error ? <p className={`${styles.notice} ${styles.error}`}>{error}</p> : null}
        {report ? (
          <div style={{ marginBlockStart: 12 }}>
            <p className={`${styles.notice} ${report.problems.length ? '' : styles.success}`}>
              {pick(lang, `${report.applied} text(s) imported into ${report.documents} document(s) for ${report.locale}, marked "needs review".`, `تم استيراد ${report.applied} نص(نصوص) إلى ${report.documents} مستند(ات) للغة ${report.locale} مع وسمها "تحتاج مراجعة".`)}
            </p>
            {report.problems.length ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ inlineSize: 70 }}>{pick(lang, 'Row', 'الصف')}</th>
                    <th>key</th>
                    <th>{pick(lang, 'Problem', 'المشكلة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.problems.map((p, i) => (
                    <tr key={i}>
                      <td>{p.row}</td>
                      <td style={{ wordBreak: 'break-all' }}>{p.key}</td>
                      <td>{p.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
