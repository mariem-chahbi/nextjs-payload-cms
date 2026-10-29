/**
 * Rich text is translated text-node by text-node: the tree (paragraphs, headings, links, lists,
 * bold/italic/color/size...) is kept exactly; only `text` strings change. No package imports.
 */
type LexicalNode = { type?: string; text?: string; children?: LexicalNode[]; [key: string]: unknown }
export type LexicalState = { root: LexicalNode }

export const isLexicalState = (value: unknown): value is LexicalState =>
  typeof value === 'object' && value !== null && 'root' in value && typeof (value as LexicalState).root === 'object'

type Segment = { get: () => string; set: (value: string) => void }

/** Translatable strings of the tree, in document order: text nodes and inline-button labels. */
const visitSegments = (node: LexicalNode, visit: (segment: Segment) => void) => {
  if (node.type === 'text' && typeof node.text === 'string') {
    visit({ get: () => node.text ?? '', set: (value) => (node.text = value) })
  }
  const fields = node.fields as { blockType?: string; label?: unknown } | undefined
  if (node.type === 'inlineBlock' && fields?.blockType === 'inlineButton' && typeof fields.label === 'string') {
    visit({ get: () => String(fields.label), set: (value) => (fields.label = value) })
  }
  node.children?.forEach((child) => visitSegments(child, visit))
}

/** Text of every text node (and inline button label), in document order; formatting stays in the tree. */
export const extractTextSegments = (state: unknown): string[] => {
  if (!isLexicalState(state)) return []
  const out: string[] = []
  visitSegments(state.root, (segment) => out.push(segment.get()))
  return out
}

/** Copy of the tree with segment i replaced by segments[i]. Extra/missing segments are ignored. */
export const replaceTextSegments = <T>(state: T, segments: string[]): T => {
  if (!isLexicalState(state)) return state
  const copy = structuredClone(state) as LexicalState
  let i = 0
  visitSegments(copy.root, (segment) => {
    if (i < segments.length) segment.set(segments[i]!)
    i++
  })
  return copy as T
}

/** Translates rich text while keeping all formatting. Whitespace at node edges is preserved. */
export const translateLexical = async <T>(state: T, translate: (texts: string[]) => Promise<string[]>): Promise<T> => {
  const segments = extractTextSegments(state)
  const work = segments.map((text, index) => ({ index, text, lead: text.match(/^\s*/)?.[0] ?? '', trail: text.match(/\s*$/)?.[0] ?? '' }))
  const toTranslate = work.filter((w) => w.text.trim().length > 0)
  const translated = toTranslate.length ? await translate(toTranslate.map((w) => w.text.trim())) : []
  const next = [...segments]
  toTranslate.forEach((w, k) => {
    next[w.index] = `${w.lead}${translated[k] ?? w.text.trim()}${w.trail}`
  })
  return replaceTextSegments(state, next)
}

/** Plain text of the whole tree (paragraphs separated by newlines). */
export const lexicalPlainText = (state: unknown): string => {
  if (!isLexicalState(state)) return ''
  const blocks: string[] = []
  const walk = (node: LexicalNode, acc: string[]) => {
    if (node.type === 'text') acc.push(node.text ?? '')
    else node.children?.forEach((c) => walk(c, acc))
  }
  for (const child of state.root.children ?? []) {
    const acc: string[] = []
    walk(child, acc)
    blocks.push(acc.join(''))
  }
  return blocks.join('\n').trim()
}

/** Paragraph direction follows the language: Arabic text in Arabic rich text is right-to-left. */
export const setLexicalDirection = <T>(state: T, direction: 'rtl' | 'ltr'): T => {
  if (!isLexicalState(state)) return state
  const copy = structuredClone(state) as LexicalState
  const walk = (node: LexicalNode) => {
    if ('direction' in node) node.direction = direction
    node.children?.forEach(walk)
  }
  walk(copy.root)
  return copy as T
}
