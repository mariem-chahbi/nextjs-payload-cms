import { APIError, type Field, type FieldAccess, type PayloadRequest, type Tab } from 'payload'

import { isTranslatableLocale, isTranslator } from './roles'

/**
 * Translator rules (decision 4 + structure guard):
 *  1. Field access: a translator may update a field only when it is localized (itself or through an
 *     ancestor) and the request locale is a non-default locale. This makes everything else read-only
 *     for translators in the admin panel.
 *  2. Structure guard (pages + globals): Payload strips field-access-denied values *before*
 *     `beforeChange`, so `beforeOperation` keeps a copy of the raw incoming data and `beforeChange`
 *     compares it with the stored document (in that locale, without fallback). Any change to block
 *     count / types / order / ids, array rows, or a non-localized value rejects the whole save.
 *     Translators may also never publish, and never write in a missing / 'all' / default locale.
 */

const CONTEXT_KEY = 'translatorIncomingData'

type FieldList = Field[]
type AnyRecord = Record<string, unknown>

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isLocalizedField = (field: Field | Tab): boolean => 'localized' in field && field.localized === true

const hasName = (field: Field | Tab): field is (Field | Tab) & { name: string } =>
  'name' in field && typeof field.name === 'string' && field.name.length > 0

const isVirtual = (field: Field): boolean => 'virtual' in field && Boolean(field.virtual)

/** Shared fields translators may still write (e.g. the per-locale translation status JSON). */
const isTranslatorEditable = (field: Field): boolean =>
  Boolean((field as { custom?: { translatorEditable?: boolean } }).custom?.translatorEditable)

// ── 1. Field-level access ───────────────────────────────────────────────────────

export const translatorMayUpdateField = (
  localized: boolean,
  req: Pick<PayloadRequest, 'locale' | 'user'>,
): boolean => {
  if (!isTranslator(req.user as never)) return true
  return localized && isTranslatableLocale(req.locale)
}

const withUpdateRule = (field: Field, localized: boolean): Field => {
  const existing = (field as { access?: { update?: FieldAccess } }).access?.update
  const update: FieldAccess = async (args) => {
    if (!translatorMayUpdateField(localized, args.req)) return false
    return existing ? existing(args) : true
  }
  return { ...field, access: { ...(field as { access?: object }).access, update } } as Field
}

/**
 * Adds the translator update rule to every *leaf* data field outside page-builder blocks.
 * Containers get no rule themselves: denying a container would also discard the localized texts
 * inside it. Fields INSIDE blocks get no per-field rule either: Payload evaluates field access on
 * every admin request, and hundreds of block fields made each admin page take 15–30 s in dev.
 * The structure guard below protects block contents instead (it rejects any change to a shared value).
 */
export const applyTranslatorFieldAccess = (fields: FieldList, parentLocalized = false): FieldList =>
  fields.map((field) => {
    if (field.type === 'ui' || field.type === 'join' || isVirtual(field) || isTranslatorEditable(field)) return field
    const localized = parentLocalized || isLocalizedField(field)

    switch (field.type) {
      case 'tabs':
        return {
          ...field,
          tabs: field.tabs.map((tab) => ({
            ...tab,
            fields: applyTranslatorFieldAccess(tab.fields, localized || isLocalizedField(tab)),
          })),
        }
      case 'blocks':
        return field
      case 'array':
      case 'group':
      case 'row':
      case 'collapsible':
        return { ...field, fields: applyTranslatorFieldAccess(field.fields, localized) } as Field
      default:
        return withUpdateRule(field, localized)
    }
  })

// ── 2. Structure signature ──────────────────────────────────────────────────────

/** Comparable form of a leaf value: ids for relations, ISO for dates, null for "empty". */
export const normalizeLeaf = (value: unknown): unknown => {
  if (value === undefined || value === null || value === '' || value === false) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (Array.isArray(value)) return value.map(normalizeLeaf)
  if (isRecord(value)) {
    if ('relationTo' in value && 'value' in value) return `${String(value.relationTo)}:${normalizeLeaf(value.value)}`
    if ('id' in value && (typeof value.id === 'string' || typeof value.id === 'number')) return String(value.id)
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeLeaf(value[key])]),
    )
  }
  return value
}

const rowId = (row: unknown, index: number): string =>
  isRecord(row) && (typeof row.id === 'string' || typeof row.id === 'number') ? String(row.id) : `#${index}`

/**
 * Flattens everything a translator must not change into `path → value`:
 * row ids/order/types of every array and blocks field, and every non-localized leaf value.
 */
export const structureSignature = (fields: FieldList, data: unknown): Map<string, string> => {
  const out = new Map<string, string>()

  const walk = (list: FieldList, siblingData: unknown, path: string, parentLocalized: boolean) => {
    const sibling = isRecord(siblingData) ? siblingData : {}

    for (const field of list) {
      if (field.type === 'ui' || field.type === 'join' || isVirtual(field) || isTranslatorEditable(field)) continue
      const localized = parentLocalized || isLocalizedField(field)

      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          const tabLocalized = localized || isLocalizedField(tab)
          if (hasName(tab)) walk(tab.fields, sibling[tab.name], `${path}${tab.name}.`, tabLocalized)
          else walk(tab.fields, sibling, path, tabLocalized)
        }
        continue
      }

      if (field.type === 'row' || field.type === 'collapsible' || (field.type === 'group' && !hasName(field))) {
        walk(field.fields, sibling, path, localized)
        continue
      }

      if (!hasName(field)) continue
      const key = `${path}${field.name}`
      const value = sibling[field.name]

      if (field.type === 'group') {
        walk(field.fields, value, `${key}.`, localized)
        continue
      }

      if (field.type === 'array') {
        const rows = Array.isArray(value) ? value : []
        out.set(`${key}[rows]`, JSON.stringify(rows.map(rowId)))
        rows.forEach((row, i) => walk(field.fields, row, `${key}[${rowId(row, i)}].`, localized))
        continue
      }

      if (field.type === 'blocks') {
        const rows = Array.isArray(value) ? value : []
        const blocks = field.blocks ?? []
        out.set(
          `${key}[blocks]`,
          JSON.stringify(rows.map((row, i) => [rowId(row, i), isRecord(row) ? row.blockType : null])),
        )
        rows.forEach((row, i) => {
          const block = blocks.find((b) => isRecord(row) && b.slug === row.blockType)
          if (block) walk(block.fields, row, `${key}[${rowId(row, i)}].`, localized)
        })
        continue
      }

      if (!localized) out.set(key, JSON.stringify(normalizeLeaf(value)))
    }
  }

  walk(fields, data, '', false)
  return out
}

/** Paths whose structure or non-localized value differs between two signatures. */
export const diffSignatures = (before: Map<string, string>, after: Map<string, string>): string[] => {
  const keys = new Set([...before.keys(), ...after.keys()])
  return [...keys].filter((key) => before.get(key) !== after.get(key)).sort()
}

// ── 3. Hooks ────────────────────────────────────────────────────────────────────

export class TranslatorForbiddenError extends APIError {
  constructor(message: string) {
    super(message, 403, undefined, true)
    this.name = 'TranslatorForbiddenError'
  }
}

type BeforeOperationArgs = { args?: { data?: unknown; req?: PayloadRequest }; operation: string; req: PayloadRequest }
type BeforeChangeArgs = { data: AnyRecord; originalDoc?: AnyRecord; req: PayloadRequest }

const assertTranslatorLocale = (req: Pick<PayloadRequest, 'locale'>) => {
  if (!isTranslatableLocale(req.locale)) {
    throw new TranslatorForbiddenError(
      `Translators can only save in a translation locale (not "${req.locale ?? 'missing'}"). Switch the locale and try again.`,
    )
  }
}

/** Keeps the untouched incoming data, before field access strips anything. */
export const translatorBeforeOperation = ({ args, operation, req }: BeforeOperationArgs) => {
  if (!isTranslator(req.user as never)) return args
  if (operation === 'restoreVersion' || operation === 'delete') {
    throw new TranslatorForbiddenError('Translators cannot restore versions or delete content.')
  }
  if ((operation === 'update' || operation === 'create') && args?.data !== undefined) {
    req.context[CONTEXT_KEY] = structuredClone(args.data)
  }
  return args
}

/**
 * Rejects translator saves that publish (when the entity has drafts), use the wrong locale, or
 * change the structure / any shared value.
 */
export const createTranslatorGuard =
  (fields: FieldList, { drafts = true }: { drafts?: boolean } = {}) =>
  ({ data, originalDoc, req }: BeforeChangeArgs): AnyRecord => {
    if (!isTranslator(req.user as never)) return data

    assertTranslatorLocale(req)

    // By now Payload has set `_status` to 'draft' for a draft save; anything else publishes.
    if (drafts && data._status !== 'draft') {
      throw new TranslatorForbiddenError('Translators can save drafts only. An editor publishes the change.')
    }

    const incoming = (req.context[CONTEXT_KEY] as AnyRecord | undefined) ?? data

    if (!originalDoc) {
      throw new TranslatorForbiddenError('Translators cannot create new documents.')
    }

    const { _status: _ignored, ...incomingFields } = incoming
    const changed = diffSignatures(
      structureSignature(fields, originalDoc),
      structureSignature(fields, { ...originalDoc, ...incomingFields }),
    )
    if (changed.length > 0) {
      throw new TranslatorForbiddenError(
        `Translators can only change translated text. These parts are shared across languages and were changed: ${changed
          .slice(0, 5)
          .join(', ')}${changed.length > 5 ? ` (+${changed.length - 5} more)` : ''}.`,
      )
    }
    return data
  }
