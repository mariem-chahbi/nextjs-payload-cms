import type { Payload, PayloadRequest } from 'payload'

import { isContentManager } from '@/access/roles'
import { isEmptyValue, resolveWithFallback } from '@/i18n/fallback'
import { DEFAULT_LOCALE, getFallbackChain, getLanguage, LOCALE_CODES, type LocaleCode } from '@/i18n/locales'

import { autoTranslateDocument } from './auto'
import {
  type EntityRef,
  entityKey,
  getEntityFields,
  listTranslatableEntities,
  loadEntityDoc,
  parseEntityKey,
  saveEntityDoc,
} from './entities'
import { applyImportRows, buildExportRows, type ExchangeRow, type ImportProblem, parseRowKey } from './exchange'
import { collectTranslatable, setAtPath } from './fields'
import { documentProgress, toPercent, type LocaleProgress } from './progress'
import { getTranslationProvider, type TranslationProvider } from './providers'
import type { TranslationMeta, TranslationStatus } from './status'

/** Source locale for a target: what it falls back to (ar-TN → ar, ar → en, en → ar for ar→en). */
export const defaultSourceFor = (target: LocaleCode): LocaleCode =>
  target === DEFAULT_LOCALE ? 'ar' : (getFallbackChain(target)[1] ?? DEFAULT_LOCALE)

const canPublish = (req: PayloadRequest) => isContentManager(req.user as never)

// ── Translation view ────────────────────────────────────────────────────────────

export type TranslationRow = {
  path: string
  label: string
  type: 'text' | 'textarea' | 'richText'
  translate: boolean
  source: unknown
  target: unknown
  /** Locale the visitor currently sees for this text when the target is empty. */
  inheritedFrom?: LocaleCode
  inheritedValue?: unknown
}

export const getTranslationRows = async (payload: Payload, req: PayloadRequest, ref: EntityRef, source: LocaleCode, target: LocaleCode) => {
  const fields = getEntityFields(payload, ref)
  if (!fields) throw new Error('Unknown document type')
  const chain = getFallbackChain(target)
  const locales = [...new Set([source, ...chain])]
  const docs = Object.fromEntries(await Promise.all(locales.map(async (l) => [l, await loadEntityDoc(payload, ref, l, req)] as const)))
  const maps = Object.fromEntries(locales.map((l) => [l, new Map(collectTranslatable(fields, docs[l]).map((e) => [e.path, e.value]))]))

  const rows: TranslationRow[] = collectTranslatable(fields, docs[source]).map((entry) => {
    const targetValue = maps[target]!.get(entry.path)
    const row: TranslationRow = { path: entry.path, label: entry.label, type: entry.type, translate: entry.translate, source: entry.value, target: targetValue ?? null }
    if (isEmptyValue(targetValue)) {
      const valuesByLocale = Object.fromEntries(chain.slice(1).map((l) => [l, maps[l]?.get(entry.path)]))
      const resolved = resolveWithFallback(valuesByLocale, target)
      if (resolved.source) {
        row.inheritedFrom = resolved.source
        row.inheritedValue = resolved.value
      }
    }
    return row
  })
  const meta = (docs[source] as { translation?: TranslationMeta }).translation
  return { rows, meta, title: String((docs[source] as { title?: string }).title ?? ref.slug) }
}

/** Saves edited target values (path → value) from the Translation view. */
export const saveTranslationValues = async ({
  payload,
  req,
  ref,
  locale,
  values,
  status,
  publish,
}: {
  payload: Payload
  req: PayloadRequest
  ref: EntityRef
  locale: LocaleCode
  values: Record<string, unknown>
  status?: TranslationStatus
  publish?: boolean
}) => {
  const fields = getEntityFields(payload, ref)
  if (!fields) throw new Error('Unknown document type')
  const known = new Set(collectTranslatable(fields, await loadEntityDoc(payload, ref, DEFAULT_LOCALE, req)).map((e) => e.path))
  const source = await loadEntityDoc(payload, ref, defaultSourceFor(locale), req)
  const data = await loadEntityDoc(payload, ref, locale, req)
  for (const [path, value] of Object.entries(values)) {
    if (!known.has(path)) throw new Error(`Unknown field "${path}"`)
    setAtPath(data, path, value === '' ? null : value, source)
  }
  return saveEntityDoc({ payload, ref, locale, data, req, status, publish: publish && canPublish(req) })
}

// ── Auto-translate ──────────────────────────────────────────────────────────────

export const autoTranslateEntity = async ({
  payload,
  req,
  ref,
  from,
  to,
  overwrite = false,
  provider = getTranslationProvider(),
}: {
  payload: Payload
  req: PayloadRequest
  ref: EntityRef
  from: LocaleCode
  to: LocaleCode
  overwrite?: boolean
  provider?: TranslationProvider
}) => {
  if (getLanguage(from) === getLanguage(to)) throw new Error('Pick two different languages (e.g. en → ar).')
  const fields = getEntityFields(payload, ref)
  if (!fields) throw new Error('Unknown document type')
  const [source, target] = await Promise.all([loadEntityDoc(payload, ref, from, req), loadEntityDoc(payload, ref, to, req)])
  const result = await autoTranslateDocument({ fields, source, target, from, to, provider, overwrite })
  if (result.translated.length > 0) {
    // Machine output is never final: mark the target locale "needs review".
    await saveEntityDoc({ payload, ref, locale: to, data: result.data, req, status: 'needs-review' })
  }
  return { entity: entityKey(ref), provider: provider.name, translated: result.translated.length, skipped: result.skipped, paths: result.translated }
}

// ── Export / import ─────────────────────────────────────────────────────────────

const uiStringRefs = async (payload: Payload, req: PayloadRequest) => {
  const { docs } = await payload.find({ collection: 'translations', pagination: false, depth: 0, locale: 'en', overrideAccess: false, user: req.user, sort: 'namespace' })
  return docs.map((d) => ({ ref: { kind: 'collection', slug: 'translations', id: String(d.id) } as EntityRef, title: `UI string ${d.namespace}.${d.key}` }))
}

export const exportLocale = async (payload: Payload, req: PayloadRequest, target: LocaleCode, missingOnly: boolean): Promise<ExchangeRow[]> => {
  const source = defaultSourceFor(target)
  const entities = [...(await listTranslatableEntities(payload, req)), ...(await uiStringRefs(payload, req))]
  const rows: ExchangeRow[] = []
  for (const { ref, title } of entities) {
    const fields = getEntityFields(payload, ref)
    if (!fields) continue
    const [sourceDoc, targetDoc] = await Promise.all([loadEntityDoc(payload, ref, source, req), loadEntityDoc(payload, ref, target, req)])
    rows.push(...buildExportRows({ fields, entity: entityKey(ref), title, source: sourceDoc, target: targetDoc, missingOnly }))
  }
  return rows
}

export type ImportReport = { locale: LocaleCode; applied: number; documents: number; problems: ImportProblem[] }

export const importLocale = async ({
  payload,
  req,
  target,
  rows,
  publish,
}: {
  payload: Payload
  req: PayloadRequest
  target: LocaleCode
  rows: Record<string, string>[]
  publish?: boolean
}): Promise<ImportReport> => {
  const problems: ImportProblem[] = []
  const byEntity = new Map<string, { row: number; key: string; path: string; segment?: number; value: string }[]>()

  rows.forEach((raw, index) => {
    const rowNumber = index + 2 // header is row 1
    const key = String(raw.key ?? '').trim()
    if (!key && !String(raw.target ?? '').trim()) return
    const parsed = parseRowKey(key)
    if (!parsed || !parseEntityKey(parsed.entity)) {
      problems.push({ row: rowNumber, key, message: 'Invalid key. Keep the "key" column exactly as exported.' })
      return
    }
    if (!byEntity.has(parsed.entity)) byEntity.set(parsed.entity, [])
    byEntity.get(parsed.entity)!.push({ row: rowNumber, key, path: parsed.path, segment: parsed.segment, value: String(raw.target ?? '') })
  })

  let applied = 0
  let documents = 0
  for (const [key, entityRows] of byEntity) {
    const ref = parseEntityKey(key)!
    const fields = getEntityFields(payload, ref)
    if (!fields) {
      entityRows.forEach((r) => problems.push({ row: r.row, key: r.key, message: 'Unknown document type.' }))
      continue
    }
    let source: Record<string, unknown>
    let current: Record<string, unknown>
    try {
      ;[source, current] = await Promise.all([loadEntityDoc(payload, ref, defaultSourceFor(target), req), loadEntityDoc(payload, ref, target, req)])
    } catch {
      entityRows.forEach((r) => problems.push({ row: r.row, key: r.key, message: 'Document not found (deleted, or you cannot read it).' }))
      continue
    }
    const result = applyImportRows({ fields, source, target: current, rows: entityRows })
    problems.push(...result.problems)
    if (result.applied === 0) continue
    try {
      await saveEntityDoc({ payload, ref, locale: target, data: result.data, req, status: 'needs-review', publish: publish && canPublish(req) })
      applied += result.applied
      documents++
    } catch (error) {
      entityRows.forEach((r) => problems.push({ row: r.row, key: r.key, message: `Not saved: ${(error as Error).message}` }))
    }
  }
  problems.sort((a, b) => a.row - b.row)
  return { locale: target, applied, documents, problems }
}

// ── Dashboard ───────────────────────────────────────────────────────────────────

export type ProgressReport = {
  generatedAt: string
  locales: LocaleProgress[]
  documents: { entity: string; title: string; editURL: string; missing: Partial<Record<LocaleCode, number>>; status?: TranslationMeta['locales'] }[]
}

type LocaleValues = Partial<Record<LocaleCode, Record<string, unknown>>>

/**
 * Coverage over pages, globals and UI strings.
 * Pages/globals load in parallel (one query per locale); UI strings come from ONE query with
 * `locale: 'all'`, split per locale in memory.
 */
export const computeProgress = async (
  payload: Payload,
  req: PayloadRequest,
  { overrideAccess = false }: { overrideAccess?: boolean } = {},
): Promise<ProgressReport> => {
  const access = { overrideAccess }
  const [entities, strings] = await Promise.all([
    listTranslatableEntities(payload, req, access),
    payload.find({ collection: 'translations', locale: 'all', depth: 0, pagination: false, sort: 'namespace', overrideAccess, user: req.user }),
  ])

  const loaded: { ref: EntityRef; title: string; values: LocaleValues }[] = await Promise.all(
    entities.map(async ({ ref, title }) => ({
      ref,
      title,
      values: Object.fromEntries(await Promise.all(LOCALE_CODES.map(async (l) => [l, await loadEntityDoc(payload, ref, l, req, access)] as const))),
    })),
  )
  for (const doc of strings.docs) {
    const all = (doc.value ?? {}) as unknown as Partial<Record<LocaleCode, string | null>>
    loaded.push({
      ref: { kind: 'collection', slug: 'translations', id: String(doc.id) },
      title: `UI string ${doc.namespace}.${doc.key}`,
      values: Object.fromEntries(
        LOCALE_CODES.map((l) => [l, { value: all[l] ?? null, ...(l === 'en' ? { translation: doc.translation } : {}) }]),
      ),
    })
  }

  const totals = Object.fromEntries(LOCALE_CODES.map((l) => [l, { covered: 0, own: 0 }]))
  let total = 0
  const documents: ProgressReport['documents'] = []

  for (const { ref, title, values } of loaded) {
    const fields = getEntityFields(payload, ref)
    if (!fields) continue
    const progress = documentProgress(fields, values, LOCALE_CODES)
    total += progress.total
    for (const l of LOCALE_CODES) {
      totals[l]!.covered += progress.perLocale[l]!.covered
      totals[l]!.own += progress.perLocale[l]!.own
    }
    documents.push({
      entity: entityKey(ref),
      title,
      editURL: translateViewURL(ref),
      missing: Object.fromEntries(Object.entries(progress.missingPaths).map(([l, paths]) => [l, paths?.length ?? 0])),
      status: (values.en as { translation?: TranslationMeta }).translation?.locales,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    locales: LOCALE_CODES.map((locale) => ({
      locale,
      total,
      covered: totals[locale]!.covered,
      own: totals[locale]!.own,
      percent: toPercent(totals[locale]!.covered, total),
    })),
    documents: documents.filter((d) => Object.values(d.missing).some((n) => (n ?? 0) > 0) || (d.status && Object.values(d.status).some((s) => s?.status === 'needs-review'))),
  }
}

/** Admin URL of the Translation view for a document. */
export const translateViewURL = (ref: EntityRef, target?: LocaleCode) =>
  `/admin/translate/${ref.kind === 'global' ? `global/${ref.slug}` : `collection/${ref.slug}/${ref.id}`}${target ? `?target=${target}` : ''}`
