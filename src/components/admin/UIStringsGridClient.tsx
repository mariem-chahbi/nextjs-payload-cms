'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { isEmptyValue, resolveWithFallback } from '@/i18n/fallback'
import { getDirection, getFallbackChain, getLanguage, LOCALES, type LocaleCode } from '@/i18n/locales'

import styles from './admin.module.css'
import { pick } from './shared'

type StringDoc = { id: number; namespace: string; key: string; value?: Partial<Record<LocaleCode, string | null>> | null }
type CellState = 'saving' | 'saved' | 'error'

/** Missing = no text in this locale or any same-language fallback (Arabic never "counts" English). */
const isMissing = (doc: StringDoc, locale: LocaleCode) =>
  !getFallbackChain(locale)
    .filter((l) => getLanguage(l) === getLanguage(locale))
    .some((l) => !isEmptyValue(doc.value?.[l]))

export function UIStringsGridClient({ lang, canCreate }: { lang: string; canCreate: boolean }) {
  const [docs, setDocs] = useState<StringDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [search, setSearch] = useState('')
  const [namespace, setNamespace] = useState('')
  const [missingOnly, setMissingOnly] = useState(false)
  const [cells, setCells] = useState<Record<string, CellState>>({})
  const [draft, setDraft] = useState({ namespace: 'common', key: '', value: '' })

  const fetchDocs = useCallback(async () => {
    const res = await fetch('/api/translations?locale=all&depth=0&limit=0&pagination=false&sort=namespace,key', { credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return ((await res.json()) as { docs: StringDoc[] }).docs
  }, [])

  const load = useCallback(async () => {
    try {
      setDocs(await fetchDocs())
      setError(undefined)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [fetchDocs])

  useEffect(() => {
    let cancelled = false
    fetchDocs()
      .then((loaded) => !cancelled && setDocs(loaded))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [fetchDocs])

  const namespaces = useMemo(() => [...new Set(docs.map((d) => d.namespace))].sort(), [docs])
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((doc) => {
      if (namespace && doc.namespace !== namespace) return false
      if (missingOnly && !LOCALES.some((l) => isMissing(doc, l.code))) return false
      if (!q) return true
      return `${doc.namespace}.${doc.key}`.toLowerCase().includes(q) || Object.values(doc.value ?? {}).some((v) => v?.toLowerCase().includes(q))
    })
  }, [docs, search, namespace, missingOnly])

  const saveCell = async (doc: StringDoc, locale: LocaleCode, value: string) => {
    if ((doc.value?.[locale] ?? '') === value) return
    const cellKey = `${doc.id}:${locale}`
    setCells((c) => ({ ...c, [cellKey]: 'saving' }))
    try {
      const res = await fetch(`/api/translations/${doc.id}?locale=${locale}&depth=0`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value || null }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { errors?: { message: string }[] }
        throw new Error(body.errors?.[0]?.message ?? `HTTP ${res.status}`)
      }
      setDocs((all) => all.map((d) => (d.id === doc.id ? { ...d, value: { ...d.value, [locale]: value || null } } : d)))
      setCells((c) => ({ ...c, [cellKey]: 'saved' }))
    } catch (e) {
      setCells((c) => ({ ...c, [cellKey]: 'error' }))
      setError(`${doc.namespace}.${doc.key} (${locale}): ${(e as Error).message}`)
    }
  }

  const create = async () => {
    const res = await fetch('/api/translations?locale=en', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { errors?: { message: string }[] }
      setError(body.errors?.[0]?.message ?? `HTTP ${res.status}`)
      return
    }
    setDraft({ namespace: draft.namespace, key: '', value: '' })
    await load()
  }

  return (
    <div>
      <div className={styles.toolbar} style={{ marginBlockEnd: 12 }}>
        <input className={styles.input} style={{ maxInlineSize: 280 }} placeholder={pick(lang, 'Search keys and texts…', 'ابحث في المفاتيح والنصوص…')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={styles.select} value={namespace} onChange={(e) => setNamespace(e.target.value)}>
          <option value="">{pick(lang, 'All namespaces', 'كل المجالات')}</option>
          {namespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>
        <label className={styles.toolbar}>
          <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
          {pick(lang, 'Missing only', 'الناقصة فقط')}
        </label>
        <span className={styles.muted}>
          {visible.length} / {docs.length}
        </span>
      </div>
      {error ? <p className={`${styles.notice} ${styles.error}`}>{error}</p> : null}
      {loading ? <p className={styles.muted}>{pick(lang, 'Loading…', 'جارٍ التحميل…')}</p> : null}

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ inlineSize: '20%' }}>{pick(lang, 'Key', 'المفتاح')}</th>
            {LOCALES.map((l) => (
              <th key={l.code} dir={getDirection(l.code)} lang={l.code}>
                {l.nativeLabel} <span className={styles.muted}>({l.code})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((doc) => (
            <tr key={doc.id}>
              <td>
                <div className={styles.label}>{doc.namespace}</div>
                <strong style={{ wordBreak: 'break-word' }}>{doc.key}</strong>
              </td>
              {LOCALES.map((l) => {
                const own = doc.value?.[l.code] ?? ''
                const inherited = resolveWithFallback(doc.value ?? {}, l.code)
                const state = cells[`${doc.id}:${l.code}`]
                const missing = isMissing(doc, l.code)
                return (
                  <td key={l.code} style={missing ? { background: 'var(--theme-error-50)' } : undefined}>
                    <textarea
                      key={`${doc.id}:${l.code}:${own}`}
                      className={styles.textarea}
                      dir={getDirection(l.code)}
                      lang={l.code}
                      rows={1}
                      defaultValue={own}
                      placeholder={inherited.inherited ? String(inherited.value ?? '') : ''}
                      title={inherited.inherited ? pick(lang, `inherited from ${inherited.source}`, `موروث من ${inherited.source}`) : undefined}
                      onBlur={(e) => void saveCell(doc, l.code, e.target.value.trim())}
                    />
                    <span className={styles.muted}>{state === 'saving' ? '…' : state === 'saved' ? '✓' : state === 'error' ? '⚠' : ''}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {canCreate ? (
        <div className={styles.toolbar} style={{ marginBlockStart: 16 }}>
          <strong>{pick(lang, 'New key', 'مفتاح جديد')}</strong>
          <input className={styles.input} style={{ maxInlineSize: 140 }} value={draft.namespace} onChange={(e) => setDraft({ ...draft, namespace: e.target.value })} placeholder="namespace" />
          <input className={styles.input} style={{ maxInlineSize: 220 }} value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} placeholder="key (nav.home)" />
          <input className={styles.input} style={{ maxInlineSize: 280 }} value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} placeholder={pick(lang, 'English text', 'النص الإنجليزي')} />
          <button type="button" className={styles.button} disabled={!draft.key} onClick={() => void create()}>
            {pick(lang, 'Add', 'إضافة')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
