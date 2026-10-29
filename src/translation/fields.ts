import type { Block, Field, Tab } from 'payload'

import { isEmptyValue } from '@/i18n/fallback'

import { extractTextSegments, isLexicalState } from './lexical'

/**
 * Walks a document and lists every localized text field with a stable path:
 *   "title", "layout.0.content", "layout.2.columns.1.content.0.body", "meta.description".
 * Paths use row indexes, so the same path points to the same place in every locale
 * (shared layouts share their rows; localized layouts are copied with "Copy to locale").
 * No server-only imports: used by endpoints, the admin views and tests.
 */
export type TranslatableType = 'text' | 'textarea' | 'richText'

export type TranslatableEntry = {
  path: string
  /** Human context: "Layout › Hero 1 › Content". */
  label: string
  type: TranslatableType
  value: unknown
  /** False for URLs, phone numbers, emails: localized for regional overrides, never machine-translated. */
  translate: boolean
}

type Labelled = { label?: unknown; name?: string; labels?: { singular?: unknown } }

const labelOf = (field: Labelled | Tab | Block, fallback: string): string => {
  const raw = ('labels' in field && field.labels?.singular) || ('label' in field ? field.label : undefined)
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'en' in raw && typeof (raw as Record<string, unknown>).en === 'string') {
    return (raw as Record<string, string>).en
  }
  return fallback
}

const humanize = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export const isTranslatableType = (type: string): type is TranslatableType =>
  type === 'text' || type === 'textarea' || type === 'richText'

export const collectTranslatable = (fields: Field[], data: unknown): TranslatableEntry[] => {
  const out: TranslatableEntry[] = []

  const walk = (list: Field[], sibling: unknown, path: string, trail: string[], localized: boolean) => {
    const values = isRecord(sibling) ? sibling : {}
    for (const field of list) {
      if (field.type === 'ui' || field.type === 'join' || ('virtual' in field && field.virtual)) continue
      const isLocalized = localized || ('localized' in field && field.localized === true)

      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          const tabLocalized = isLocalized || ('localized' in tab && tab.localized === true)
          if ('name' in tab && tab.name) walk(tab.fields, values[tab.name], `${path}${tab.name}.`, [...trail, labelOf(tab, humanize(tab.name))], tabLocalized)
          else walk(tab.fields, values, path, trail, tabLocalized)
        }
        continue
      }
      if (field.type === 'row' || field.type === 'collapsible' || (field.type === 'group' && !('name' in field && field.name))) {
        walk(field.fields, values, path, trail, isLocalized)
        continue
      }
      if (!('name' in field) || !field.name) continue
      const name = field.name
      const value = values[name]
      const label = labelOf(field as Labelled, humanize(name))

      if (field.type === 'group') {
        walk(field.fields, value, `${path}${name}.`, [...trail, label], isLocalized)
        continue
      }
      if (field.type === 'array') {
        ;(Array.isArray(value) ? value : []).forEach((row, i) =>
          walk(field.fields, row, `${path}${name}.${i}.`, [...trail, `${label} ${i + 1}`], isLocalized),
        )
        continue
      }
      if (field.type === 'blocks') {
        ;(Array.isArray(value) ? value : []).forEach((row, i) => {
          const block = (field.blocks ?? []).find((b) => isRecord(row) && b.slug === row.blockType)
          if (block) walk(block.fields, row, `${path}${name}.${i}.`, [...trail, label, `${labelOf(block, block.slug)} ${i + 1}`], isLocalized)
        })
        continue
      }
      if (!isLocalized || !isTranslatableType(field.type)) continue
      const custom = (field as { custom?: { translate?: boolean } }).custom
      out.push({
        path: `${path}${name}`,
        label: [...trail, label].join(' › '),
        type: field.type,
        value,
        translate: custom?.translate !== false,
      })
    }
  }

  walk(fields, data, '', [], false)
  return out
}

/** Entries as a map path → value, skipping empty values. */
export const translatableMap = (fields: Field[], data: unknown): Map<string, TranslatableEntry> =>
  new Map(collectTranslatable(fields, data).filter((e) => !isEmptyValue(e.value)).map((e) => [e.path, e]))

const stripIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripIds)
  if (!isRecord(value)) return value
  return Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'id').map(([k, v]) => [k, stripIds(v)]))
}

/**
 * Sets `value` at `path` in `target`. Missing containers (e.g. a per-language layout that does not
 * exist yet in this locale) are copied from `source` first, without row ids.
 */
export const setAtPath = (target: Record<string, unknown>, path: string, value: unknown, source?: Record<string, unknown>) => {
  const segments = path.split('.')
  let node: Record<string, unknown> | unknown[] = target
  let src: unknown = source
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]!
    const container = node as Record<string, unknown>
    const srcChild = isRecord(src) || Array.isArray(src) ? (src as Record<string, unknown>)[key] : undefined
    if (container[key] === undefined || container[key] === null) {
      container[key] = srcChild !== undefined ? stripIds(structuredClone(srcChild)) : /^\d+$/.test(segments[i + 1]!) ? [] : {}
    }
    node = container[key] as Record<string, unknown>
    src = srcChild
  }
  ;(node as Record<string, unknown>)[segments.at(-1)!] = value
}

export const getAtPath = (data: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => (isRecord(node) || Array.isArray(node) ? (node as Record<string, unknown>)[key] : undefined), data)

/** Text used for hashing / comparison: plain text for strings, text segments + structure for rich text. */
export const comparableText = (entry: Pick<TranslatableEntry, 'type' | 'value'>): string => {
  if (entry.type === 'richText' && isLexicalState(entry.value)) return JSON.stringify(extractTextSegments(entry.value))
  return typeof entry.value === 'string' ? entry.value : ''
}
