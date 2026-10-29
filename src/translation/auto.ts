import type { Field } from 'payload'

import { isEmptyValue } from '@/i18n/fallback'
import { getLanguage, getDirection, type LocaleCode } from '@/i18n/locales'

import { collectTranslatable, setAtPath } from './fields'
import { extractTextSegments, isLexicalState, replaceTextSegments, setLexicalDirection } from './lexical'
import type { TranslationProvider } from './providers/types'

const BATCH = 40

const chunked = async (texts: string[], translate: (batch: string[]) => Promise<string[]>) => {
  const out: string[] = []
  for (let i = 0; i < texts.length; i += BATCH) out.push(...(await translate(texts.slice(i, i + BATCH))))
  return out
}

/**
 * Fills target-locale texts from the source locale with machine translation.
 *  - Only empty target fields (unless `overwrite`), only translatable texts (not URLs/phones).
 *  - Rich text: text nodes only, so headings, lists, links, bold/italic/colors/sizes are kept.
 *  - One provider batch per document (all plain texts + all rich-text segments together).
 * Pure: returns the new target data; the caller saves it (and marks it "needs review").
 */
export const autoTranslateDocument = async ({
  fields,
  source,
  target,
  from,
  to,
  provider,
  overwrite = false,
}: {
  fields: Field[]
  source: Record<string, unknown>
  target: Record<string, unknown>
  from: LocaleCode
  to: LocaleCode
  provider: TranslationProvider
  overwrite?: boolean
}): Promise<{ data: Record<string, unknown>; translated: string[]; skipped: number }> => {
  const targetValues = new Map(collectTranslatable(fields, target).map((e) => [e.path, e.value]))
  const candidates = collectTranslatable(fields, source).filter((e) => e.translate && !isEmptyValue(e.value))
  const todo = candidates.filter((e) => overwrite || isEmptyValue(targetValues.get(e.path)))

  // Flatten everything into one list of strings, remembering where each one goes.
  type Slot = { path: string; kind: 'plain' } | { path: string; kind: 'segment'; index: number }
  const slots: Slot[] = []
  const texts: string[] = []
  const edges: { lead: string; trail: string }[] = []
  for (const entry of todo) {
    if (entry.type === 'richText' && isLexicalState(entry.value)) {
      extractTextSegments(entry.value).forEach((segment, index) => {
        if (!segment.trim()) return
        slots.push({ path: entry.path, kind: 'segment', index })
        texts.push(segment.trim())
        edges.push({ lead: segment.match(/^\s*/)?.[0] ?? '', trail: segment.match(/\s*$/)?.[0] ?? '' })
      })
    } else if (typeof entry.value === 'string') {
      slots.push({ path: entry.path, kind: 'plain' })
      texts.push(entry.value)
      edges.push({ lead: '', trail: '' })
    }
  }

  const translatedTexts = texts.length
    ? await chunked(texts, (batch) => provider.translate(batch, getLanguage(from), getLanguage(to)))
    : []

  const data = structuredClone(target)
  const segmentsByPath = new Map<string, string[]>()
  slots.forEach((slot, i) => {
    const text = `${edges[i]!.lead}${translatedTexts[i] ?? texts[i]}${edges[i]!.trail}`
    if (slot.kind === 'plain') {
      setAtPath(data, slot.path, text, source)
      return
    }
    if (!segmentsByPath.has(slot.path)) {
      const sourceEntry = todo.find((e) => e.path === slot.path)!
      segmentsByPath.set(slot.path, extractTextSegments(sourceEntry.value))
    }
    segmentsByPath.get(slot.path)![slot.index] = text
  })
  for (const [path, segments] of segmentsByPath) {
    const sourceValue = todo.find((e) => e.path === path)!.value
    setAtPath(data, path, setLexicalDirection(replaceTextSegments(sourceValue, segments), getDirection(to)), source)
  }

  return { data, translated: todo.map((e) => e.path), skipped: candidates.length - todo.length }
}
