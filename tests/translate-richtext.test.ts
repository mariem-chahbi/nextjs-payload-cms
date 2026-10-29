import { describe, expect, it, vi } from 'vitest'

import { autoTranslateDocument } from '@/translation/auto'
import { collectTranslatable } from '@/translation/fields'
import { extractTextSegments, lexicalPlainText, translateLexical } from '@/translation/lexical'
import { libreTranslateProvider } from '@/translation/providers/libretranslate'

import { fakeProvider, pageArEmpty, pageEn, pageFields, richEn } from './translation-fixtures'

/** Same tree with every text replaced by "": compare structure and formatting only. */
const shape = (value: unknown): unknown => JSON.parse(JSON.stringify(value, (k, v) => (k === 'text' ? '' : k === 'direction' ? undefined : v)))

describe('en → ar translation keeps rich-text formatting', () => {
  it('translates only text nodes; headings, alignment, bold/italic, colors and links are unchanged', async () => {
    const translated = await translateLexical(richEn(), async (texts) => texts.map((t) => `ع:${t}`))
    expect(shape(translated)).toEqual(shape(richEn()))
    expect(extractTextSegments(translated)).toEqual(['ع:Welcome', 'ع:Build ', 'ع:fast', ' ع:today.', 'ع:Learn more'])
  })

  it('keeps spaces at node edges outside the translated text', async () => {
    const seen: string[] = []
    const translated = await translateLexical(richEn(), async (texts) => {
      seen.push(...texts)
      return texts.map((t) => t.toUpperCase())
    })
    expect(seen).toEqual(['Welcome', 'Build', 'fast', 'today.', 'Learn more'])
    expect(lexicalPlainText(translated)).toBe('WELCOME\nBUILD FAST TODAY.LEARN MORE')
  })

  it('auto-translates a whole page in one batch, fills only empty fields, skips URLs', async () => {
    const { provider, calls } = fakeProvider()
    const target = pageArEmpty()
    target.layout[1]!.items![0]!.question = 'هل هو مجاني؟' as never

    const result = await autoTranslateDocument({ fields: pageFields, source: pageEn(), target, from: 'en', to: 'ar', provider })

    expect(calls).toHaveLength(1)
    expect(calls[0]!.from).toBe('en')
    expect(calls[0]!.to).toBe('ar')
    expect(result.translated.sort()).toEqual(['layout.0.buttons.0.label', 'layout.0.content', 'meta.description', 'title'])
    expect(result.skipped).toBe(1)

    const data = result.data as ReturnType<typeof pageEn>
    expect(data.title).toBe('[ar:Home]')
    expect(data.layout[0]!.buttons![0]!.label).toBe('[ar:Start]')
    expect(data.layout[0]!.buttons![0]!.url).toBeNull() // URLs are never machine-translated
    expect(data.layout[1]!.items![0]!.question).toBe('هل هو مجاني؟') // existing translation kept
    expect(data.meta.description).toBe('[ar:The home page]')
    // Rich text: same structure and formatting, Arabic text, right-to-left paragraphs.
    expect(shape(data.layout[0]!.content)).toEqual(shape(richEn()))
    expect(extractTextSegments(data.layout[0]!.content)).toEqual(['[ar:Welcome]', '[ar:Build] ', '[ar:fast]', ' [ar:today.]', '[ar:Learn more]'])
    expect((data.layout[0]!.content as { root: { children: { direction: string }[] } }).root.children[0]!.direction).toBe('rtl')
    // Shared rows (ids) are untouched, so the translator structure guard accepts the save.
    expect(data.layout.map((b) => b.id)).toEqual(['b1', 'b2'])
  })

  it('works ar → en as well, and can overwrite existing text on request', async () => {
    const { provider, calls } = fakeProvider()
    const source = { ...pageArEmpty(), title: 'الرئيسية' }
    const target = { ...pageEn(), title: 'Old title' }
    const result = await autoTranslateDocument({ fields: pageFields, source, target, from: 'ar', to: 'en', provider, overwrite: true })
    expect(calls[0]!.from).toBe('ar')
    expect((result.data as { title: string }).title).toBe('[en:الرئيسية]')
  })

  it('lists translatable texts with readable context', () => {
    const entries = collectTranslatable(pageFields, pageEn())
    expect(entries.map((e) => [e.path, e.label, e.translate])).toEqual([
      ['title', 'Title', true],
      ['layout.0.content', 'Layout › hero 1 › Content', true],
      ['layout.0.buttons.0.label', 'Layout › hero 1 › Buttons 1 › Label', true],
      ['layout.0.buttons.0.url', 'Layout › hero 1 › Buttons 1 › Url', false],
      ['layout.1.items.0.question', 'Layout › faq 2 › Items 1 › Question', true],
      ['meta.description', 'SEO › Description', true],
    ])
  })
})

describe('LibreTranslate provider', () => {
  it('posts the whole batch to the local container and keeps order', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ translatedText: ['مرحبا', 'عالم'] }), { status: 200 }))
    const provider = libreTranslateProvider('http://localhost:5000/', fetchMock as never)
    expect(await provider.translate(['Hello', 'world'], 'en', 'ar')).toEqual(['مرحبا', 'عالم'])
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('http://localhost:5000/translate')
    expect(JSON.parse(init.body)).toEqual({ q: ['Hello', 'world'], source: 'en', target: 'ar', format: 'text' })
  })

  it('explains when the container is not reachable', async () => {
    const provider = libreTranslateProvider('http://localhost:5000', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as never)
    await expect(provider.translate(['x'], 'en', 'ar')).rejects.toThrow(/Is the container running/)
  })
})
