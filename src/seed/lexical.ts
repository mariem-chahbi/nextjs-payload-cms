/** Tiny builder for Lexical rich text used by the seed (same JSON the admin editor produces). */
type Node = Record<string, unknown>

let blockCounter = 0
const nextId = (prefix: string) => `${prefix}${(++blockCounter).toString(16).padStart(6, '0')}`

const FORMAT = { bold: 1, italic: 2, strike: 4, underline: 8, code: 16, sub: 32, sup: 64 } as const

export type TextOptions = Partial<Record<keyof typeof FORMAT, boolean>> & {
  /** TextStateFeature keys from src/lexical/textState.ts */
  color?: string
  highlight?: string
  size?: string
}

export const text = (value: string, opts: TextOptions = {}): Node => {
  const format = (Object.keys(FORMAT) as (keyof typeof FORMAT)[]).reduce((bits, k) => (opts[k] ? bits | FORMAT[k] : bits), 0)
  const state = Object.fromEntries(Object.entries({ color: opts.color, highlight: opts.highlight, size: opts.size }).filter(([, v]) => v))
  return { type: 'text', text: value, format, detail: 0, mode: 'normal', style: '', version: 1, ...(Object.keys(state).length ? { $: state } : {}) }
}

type Inline = Node | string
const inline = (children: Inline[]) => children.map((c) => (typeof c === 'string' ? text(c) : c))
const element = (type: string, children: Inline[], extra: Node = {}): Node => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  children: inline(children),
  ...extra,
})

export type Align = 'left' | 'center' | 'right' | 'justify'

export const p = (children: Inline[], align?: Align) => element('paragraph', children, { format: align ?? '', textFormat: 0 })
export const h = (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', children: Inline[], align?: Align) => element('heading', children, { tag, format: align ?? '' })
export const quote = (children: Inline[]) => element('quote', children)
export const hr = (): Node => ({ type: 'horizontalrule', version: 1 })

export const list = (kind: 'bullet' | 'number' | 'check', items: (Inline[] | { checked: boolean; children: Inline[] })[]): Node =>
  element('list', [], {
    listType: kind,
    tag: kind === 'number' ? 'ol' : 'ul',
    start: 1,
    children: items.map((item, i) => {
      const children = Array.isArray(item) ? item : item.children
      return element('listitem', children, { value: i + 1, ...(kind === 'check' ? { checked: !Array.isArray(item) && item.checked } : {}) })
    }),
  })

export const link = (label: string, url: string, opts: TextOptions = {}): Node =>
  element('link', [text(label, opts)], { version: 3, fields: { linkType: 'custom', url, newTab: url.startsWith('http') } })

export const inlineButton = (label: string, url: string, variant = 'primary'): Node => ({
  type: 'inlineBlock',
  version: 1,
  fields: { id: nextId('6a1b2c3d4e5f'), blockName: '', blockType: 'inlineButton', label, type: 'url', url, newTab: false, variant, size: 'sm' },
})

export const inlineIcon = (icon: string, color = 'theme:accent', size = '1.25em'): Node => ({
  type: 'inlineBlock',
  version: 1,
  fields: { id: nextId('6a1b2c3d4e6f'), blockName: '', blockType: 'inlineIcon', icon, color, size },
})

export const doc = (...children: Node[]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children },
})
