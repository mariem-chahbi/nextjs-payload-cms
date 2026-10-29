import { createHash } from 'crypto'

import { comparableText, type TranslatableEntry } from './fields'

const sha = (input: string) => createHash('sha256').update(input).digest('base64url').slice(0, 16)

/** Hash of one source text. */
export const hashText = (entry: Pick<TranslatableEntry, 'type' | 'value'>): string => sha(comparableText(entry))

/**
 * Hash of all translatable source texts of a document (path + text), so that editing, adding or
 * removing any English text changes it. Untranslatable entries (URLs, phones) are ignored.
 */
export const hashSource = (entries: TranslatableEntry[]): string =>
  sha(
    entries
      .filter((e) => e.translate)
      .map((e) => `${e.path}\u0000${comparableText(e)}`)
      .sort()
      .join('\u0001'),
  )

/** Per-path hashes, to tell which fields changed. */
export const hashFields = (entries: TranslatableEntry[]): Record<string, string> =>
  Object.fromEntries(entries.filter((e) => e.translate).map((e) => [e.path, hashText(e)]))
