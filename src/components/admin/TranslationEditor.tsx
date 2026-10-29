'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { isEmptyValue } from '@/i18n/fallback'
import type { LocaleCode } from '@/i18n/locales'
import { extractTextSegments, isLexicalState, lexicalPlainText, replaceTextSegments } from '@/translation/lexical'
import type { TranslationRow } from '@/translation/service'
import { TRANSLATION_STATUSES, type TranslationStatus } from '@/translation/statusTypes'

import styles from './admin.module.css'
import { pick, StatusBadge, statusLabel } from './shared'

type Props = {
  entity: string
  rows: TranslationRow[]
  source: LocaleCode
  target: LocaleCode
  sourceDir: 'rtl' | 'ltr'
  targetDir: 'rtl' | 'ltr'
  status: TranslationStatus
  canAutoTranslate: boolean
  isDefaultTarget: boolean
  lang: string
}

const asText = (value: unknown) => (typeof value === 'string' ? value : '')

/** Editable segments of a rich text target. Empty target → start from the source structure. */
const segmentsFor = (row: TranslationRow) =>
  isLexicalState(row.target) && extractTextSegments(row.target).length === extractTextSegments(row.source).length
    ? extractTextSegments(row.target)
    : extractTextSegments(row.source).map(() => '')

export function TranslationEditor(props: Props) {
  const { entity, rows, source, target, sourceDir, targetDir, canAutoTranslate, isDefaultTarget, lang } = props
  const router = useRouter()
  const [edits, setEdits] = useState<Record<string, string | string[]>>({})
  const [status, setStatus] = useState<TranslationStatus>(props.status)
  const [busy, setBusy] = useState<'save' | 'auto' | undefined>()
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | undefined>()
  const [onlyMissing, setOnlyMissing] = useState(false)

  const visible = useMemo(
    () => rows.filter((r) => !onlyMissing || isEmptyValue(r.target)),
    [rows, onlyMissing],
  )
  const dirty = Object.keys(edits).length > 0 || status !== props.status

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = (await res.json().catch(() => ({}))) as { error?: string; errors?: { message: string }[]; translated?: number; skipped?: number; provider?: string }
    if (!res.ok) throw new Error(json.error ?? json.errors?.[0]?.message ?? `HTTP ${res.status}`)
    return json
  }

  const save = async () => {
    setBusy('save')
    setMessage(undefined)
    const values: Record<string, unknown> = {}
    for (const row of rows) {
      const edit = edits[row.path]
      if (edit === undefined) continue
      if (row.type === 'richText') {
        const segments = edit as string[]
        const base = isLexicalState(row.target) && extractTextSegments(row.target).length === segments.length ? row.target : row.source
        // Untouched segments of a new translation stay empty → keep the source text there.
        const sourceSegments = extractTextSegments(row.source)
        values[row.path] = segments.every((s) => !s.trim()) ? null : replaceTextSegments(base, segments.map((s, i) => s || sourceSegments[i] || ''))
      } else values[row.path] = edit
    }
    try {
      await post('/api/translation/save', { entity, locale: target, values, status })
      setEdits({})
      setMessage({ kind: 'success', text: pick(lang, 'Saved as a draft.', 'تم الحفظ كمسودة.') })
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message })
    } finally {
      setBusy(undefined)
    }
  }

  const autoTranslate = async () => {
    setBusy('auto')
    setMessage(undefined)
    try {
      const result = await post('/api/translation/auto', { entity, from: source, to: target })
      setMessage({
        kind: 'success',
        text: pick(
          lang,
          `${result.translated} field(s) translated with ${result.provider} and marked "needs review". ${result.skipped} already had a translation.`,
          `تمت ترجمة ${result.translated} حقل(حقول) عبر ${result.provider} وتعليمها "تحتاج مراجعة". ${result.skipped} كانت مترجمة مسبقًا.`,
        ),
      })
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message })
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <div>
      <div className={styles.toolbar} style={{ marginBlockEnd: 12 }}>
        {canAutoTranslate ? (
          <button type="button" className={styles.button} onClick={autoTranslate} disabled={Boolean(busy)}>
            {busy === 'auto' ? '…' : '✨'} {pick(lang, `Auto-translate ${source} → ${target} (empty fields)`, `ترجمة آلية ${source} → ${target} (الحقول الفارغة)`)}
          </button>
        ) : null}
        <label className={styles.toolbar}>
          {pick(lang, 'Status', 'الحالة')}
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value as TranslationStatus)} disabled={isDefaultTarget}>
            {TRANSLATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.toolbar}>
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          {pick(lang, 'Only untranslated', 'غير المترجم فقط')}
        </label>
        <button type="button" className={`${styles.button} ${styles.primary}`} onClick={save} disabled={!dirty || Boolean(busy)}>
          {busy === 'save' ? '…' : pick(lang, 'Save draft', 'حفظ كمسودة')}
        </button>
      </div>
      {message ? <p className={`${styles.notice} ${styles[message.kind]}`}>{message.text}</p> : null}

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ inlineSize: '22%' }}>{pick(lang, 'Field', 'الحقل')}</th>
            <th lang={source} dir={sourceDir}>
              {source}
            </th>
            <th lang={target} dir={targetDir}>
              {target}
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => {
            const missing = isEmptyValue(row.target)
            const edited = edits[row.path] !== undefined
            return (
              <tr key={row.path} className={edited ? styles.changed : undefined}>
                <td>
                  <div className={styles.label}>{row.label}</div>
                  <div style={{ marginBlockStart: 4 }}>
                    {missing && row.inheritedFrom ? (
                      <span className={`${styles.badge} ${styles['badge-inherited']}`}>
                        {pick(lang, `inherited from ${row.inheritedFrom}`, `موروث من ${row.inheritedFrom}`)}
                      </span>
                    ) : missing ? (
                      <StatusBadge status="missing" lang={lang} />
                    ) : null}
                    {!row.translate ? <span className={styles.muted}> {pick(lang, '(not machine-translated)', '(لا تُترجم آليًا)')}</span> : null}
                  </div>
                </td>
                <td lang={source} dir={sourceDir} className={styles.sourceText}>
                  {row.type === 'richText' ? lexicalPlainText(row.source) : asText(row.source)}
                </td>
                <td lang={target} dir={targetDir}>
                  {row.type === 'richText' ? (
                    (() => {
                      const segments = (edits[row.path] as string[] | undefined) ?? segmentsFor(row)
                      const inherited = isLexicalState(row.inheritedValue) ? extractTextSegments(row.inheritedValue) : []
                      const sourceSegments = extractTextSegments(row.source)
                      return sourceSegments.map((src, i) =>
                        src.trim() ? (
                          <div key={i} className={styles.segment}>
                            <span className={styles.segmentIndex}>{i + 1}</span>
                            <textarea
                              className={styles.textarea}
                              dir={targetDir}
                              rows={Math.min(6, Math.ceil(src.length / 60) || 1)}
                              value={segments[i] ?? ''}
                              placeholder={inherited[i] ?? src}
                              onChange={(e) => {
                                const next = [...segments]
                                next[i] = e.target.value
                                setEdits((prev) => ({ ...prev, [row.path]: next }))
                              }}
                            />
                          </div>
                        ) : null,
                      )
                    })()
                  ) : (
                    <textarea
                      className={styles.textarea}
                      dir={row.translate ? targetDir : 'ltr'}
                      rows={row.type === 'textarea' ? 3 : 1}
                      value={(edits[row.path] as string | undefined) ?? asText(row.target)}
                      placeholder={asText(row.inheritedValue)}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [row.path]: e.target.value }))}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {visible.length === 0 ? <p className={styles.muted}>{pick(lang, 'Nothing to translate here.', 'لا يوجد ما يُترجم هنا.')}</p> : null}
    </div>
  )
}
