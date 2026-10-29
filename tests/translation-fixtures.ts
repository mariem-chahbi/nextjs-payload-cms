import type { Field } from 'payload'

/** Page-like schema for translation tests: shared layout with localized texts, a URL, SEO tab. */
export const pageFields: Field[] = [
  { name: 'title', type: 'text', localized: true },
  {
    name: 'layout',
    type: 'blocks',
    blocks: [
      {
        slug: 'hero',
        fields: [
          { name: 'content', type: 'richText', localized: true },
          {
            name: 'buttons',
            type: 'array',
            fields: [
              { name: 'label', type: 'text', localized: true },
              { name: 'url', type: 'text', localized: true, custom: { translate: false } },
            ],
          },
        ],
      },
      { slug: 'faq', fields: [{ name: 'items', type: 'array', fields: [{ name: 'question', type: 'text', localized: true }] }] },
    ],
  },
  { type: 'tabs', tabs: [{ name: 'meta', label: 'SEO', fields: [{ name: 'description', type: 'textarea', localized: true }] }] },
]

/** Heading (center) + paragraph: "Build " (bold) "fast" (italic, primary color) " today.", plus a link. */
export const richEn = () => ({
  root: {
    type: 'root', direction: 'ltr', format: '', indent: 0, version: 1,
    children: [
      { type: 'heading', tag: 'h2', direction: 'ltr', format: 'center', indent: 0, version: 1, children: [{ type: 'text', text: 'Welcome', format: 1, detail: 0, mode: 'normal', style: '', version: 1 }] },
      {
        type: 'paragraph', direction: 'ltr', format: '', indent: 0, version: 1, textFormat: 0,
        children: [
          { type: 'text', text: 'Build ', format: 1, detail: 0, mode: 'normal', style: '', version: 1 },
          { type: 'text', text: 'fast', format: 2, detail: 0, mode: 'normal', style: '', version: 1, $: { color: 'theme-primary' } },
          { type: 'text', text: ' today.', format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
          { type: 'link', version: 1, fields: { linkType: 'custom', url: 'https://example.com', newTab: true }, children: [{ type: 'text', text: 'Learn more', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] },
        ],
      },
    ],
  },
})

export const pageEn = () => ({
  id: 1,
  title: 'Home',
  layout: [
    { id: 'b1', blockType: 'hero', content: richEn(), buttons: [{ id: 'k1', label: 'Start', url: 'https://example.com/start' }] },
    { id: 'b2', blockType: 'faq', items: [{ id: 'q1', question: 'Is it free?' }] },
  ],
  meta: { description: 'The home page' },
})

/** The same page loaded in Arabic before translation: shared rows, empty localized texts. */
export const pageArEmpty = () => ({
  id: 1,
  title: null,
  layout: [
    { id: 'b1', blockType: 'hero', content: null, buttons: [{ id: 'k1', label: null, url: null }] },
    { id: 'b2', blockType: 'faq', items: [{ id: 'q1', question: null }] },
  ],
  meta: { description: null },
})

/** Fake provider: wraps text as [ar:…] and records batches. */
export const fakeProvider = () => {
  const calls: { texts: string[]; from: string; to: string }[] = []
  return {
    calls,
    provider: {
      name: 'fake',
      translate: async (texts: string[], from: 'en' | 'ar', to: 'en' | 'ar') => {
        calls.push({ texts, from, to })
        return texts.map((t) => `[${to}:${t}]`)
      },
    },
  }
}
