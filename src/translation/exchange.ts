import type { Field } from 'payload'

import { isEmptyValue } from '@/i18n/fallback'
import type { LocaleCode } from '@/i18n/locales'

import { collectTranslatable, getAtPath, setAtPath } from './fields'
import { extractTextSegments, isLexicalState, replaceTextSegments } from './lexical'

/**
 * Import/export rows. One row per text; rich text is split into one row per text node
 * ("…|layout.0.content#2"), so translators edit plain text in Excel and formatting survives import.
 */
export const EXPORT_HEADERS = ['key', 'context', 'type', 'source', 'target'] as const
export type ExchangeRow = Record<(typeof EXPORT_HEADERS)[number], string>

export const rowKey = (entity: string, path: string, segment?: number) =>
  segment === undefined ? `${entity}|${path}` : `${entity}|${path}#${segment}`

export const parseRowKey = (key: string): { entity: string; path: string; segment?: number } | undefined => {
  const match = /^([^|]+)\|([\w.]+?)(?:#(\d+))?$/.exec(key.trim())
  if (!match) return undefined
  return { entity: match[1]!, path: match[2]!, segment: match[3] === undefined ? undefined : Number(match[3]) }
}

/** Rows for one document: source text (e.g. en) next to the target text (e.g. ar). */
export const buildExportRows = ({
  fields,
  entity,
  title,
  source,
  target,
  missingOnly = false,
}: {
  fields: Field[]
  entity: string
  title: string
  source: Record<string, unknown>
  target: Record<string, unknown>
  missingOnly?: boolean
}): ExchangeRow[] => {
  const targetValues = new Map(collectTranslatable(fields, target).map((e) => [e.path, e.value]))
  const rows: ExchangeRow[] = []
  for (const entry of collectTranslatable(fields, source)) {
    if (!entry.translate || isEmptyValue(entry.value)) continue
    const targetValue = targetValues.get(entry.path)
    if (missingOnly && !isEmptyValue(targetValue)) continue
    const context = `${title} › ${entry.label}`
    if (entry.type === 'richText' && isLexicalState(entry.value)) {
      const sourceSegments = extractTextSegments(entry.value)
      const targetSegments = extractTextSegments(targetValue)
      const sameShape = targetSegments.length === sourceSegments.length
      sourceSegments.forEach((text, i) => {
        if (!text.trim()) return
        rows.push({
          key: rowKey(entity, entry.path, i),
          context: `${context} (${i + 1}/${sourceSegments.length})`,
          type: 'richText',
          source: text,
          target: sameShape ? (targetSegments[i] ?? '') : '',
        })
      })
    } else {
      rows.push({
        key: rowKey(entity, entry.path),
        context,
        type: entry.type,
        source: String(entry.value ?? ''),
        target: typeof targetValue === 'string' ? targetValue : '',
      })
    }
  }
  return rows
}

export type ImportProblem = { row: number; key: string; message: string }

/**
 * Applies imported rows of ONE document to its target-locale data. Validates every key against the
 * source document. Empty target cells are ignored (never delete a translation by accident).
 */
export const applyImportRows = ({
  fields,
  source,
  target,
  rows,
}: {
  fields: Field[]
  source: Record<string, unknown>
  target: Record<string, unknown>
  rows: { row: number; key: string; path: string; segment?: number; value: string }[]
}): { data: Record<string, unknown>; applied: number; problems: ImportProblem[] } => {
  const sourceEntries = new Map(collectTranslatable(fields, source).map((e) => [e.path, e]))
  const data = structuredClone(target)
  const problems: ImportProblem[] = []
  const segmentEdits = new Map<string, Map<number, string>>()
  let applied = 0

  for (const row of rows) {
    const entry = sourceEntries.get(row.path)
    if (!entry) {
      problems.push({ row: row.row, key: row.key, message: 'Unknown field: this text does not exist in the source document (was it removed or moved?).' })
      continue
    }
    if (!entry.translate) {
      problems.push({ row: row.row, key: row.key, message: 'This field is not translatable (URL, phone...).' })
      continue
    }
    if (!row.value.trim()) continue

    if (entry.type === 'richText') {
      const current = getAtPath(target, row.path)
      if (row.segment !== undefined && extractTextSegments(current)[row.segment] === row.value) continue // unchanged
      const count = extractTextSegments(entry.value).length
      if (row.segment === undefined || row.segment < 0 || row.segment >= count) {
        problems.push({ row: row.row, key: row.key, message: `Rich text needs a segment number between 0 and ${count - 1}.` })
        continue
      }
      if (!segmentEdits.has(row.path)) segmentEdits.set(row.path, new Map())
      segmentEdits.get(row.path)!.set(row.segment, row.value)
      applied++
      continue
    }
    if (row.segment !== undefined) {
      problems.push({ row: row.row, key: row.key, message: 'Segment numbers are only valid for rich text.' })
      continue
    }
    if (getAtPath(target, row.path) === row.value) continue // unchanged: do not touch the document
    setAtPath(data, row.path, row.value, source)
    applied++
  }

  for (const [path, edits] of segmentEdits) {
    const sourceValue = sourceEntries.get(path)!.value
    const sourceSegments = extractTextSegments(sourceValue)
    const current = getAtPath(data, path)
    // Keep the existing translation's formatting when it has the same shape, else start from the source.
    const base = isLexicalState(current) && extractTextSegments(current).length === sourceSegments.length ? current : sourceValue
    const segments = extractTextSegments(base)
    for (const [index, text] of edits) segments[index] = text
    setAtPath(data, path, replaceTextSegments(base, segments), source)
  }

  return { data, applied, problems }
}

export const exportFileName = (locale: LocaleCode, format: string, missingOnly: boolean) =>
  `payload-playground-${locale}${missingOnly ? '-missing' : ''}.${format}`
