import { describe, expect, it } from 'vitest'

import { documentProgress } from '@/translation/progress'
import { createTranslationStatusHook, nextTranslationMeta, type TranslationMeta } from '@/translation/status'

import { pageArEmpty, pageEn, pageFields } from './translation-fixtures'

const now = '2026-10-29T10:00:00.000Z'

describe('translation status', () => {
  const enSaved = nextTranslationMeta({ fields: pageFields, previous: undefined, doc: pageEn(), locale: 'en', now })

  it('records the English source hash', () => {
    expect(enSaved.sourceHash).toMatch(/\S{8,}/)
    expect(Object.keys(enSaved.sourceFields!)).toContain('layout.0.content')
    expect(enSaved.sourceFields).not.toHaveProperty('layout.0.buttons.0.url')
  })

  it('a translator marking Arabic "done" pins it to the current English text', () => {
    const meta = nextTranslationMeta({ fields: pageFields, previous: enSaved, doc: pageArEmpty(), locale: 'ar', requestedStatus: 'done', now })
    expect(meta.locales?.ar).toEqual({ status: 'done', basedOn: enSaved.sourceHash, changed: undefined, updatedAt: now })
  })

  it('editing an English text marks done translations "needs review" and lists the changed fields', () => {
    const done: TranslationMeta = { ...enSaved, locales: { ar: { status: 'done', basedOn: enSaved.sourceHash }, 'ar-TN': { status: 'needs-review' } } }
    const edited = pageEn()
    edited.layout[1]!.items![0]!.question = 'Is it really free?'
    const meta = nextTranslationMeta({ fields: pageFields, previous: done, doc: edited, locale: 'en', now })
    expect(meta.locales?.ar?.status).toBe('needs-review')
    expect(meta.locales?.ar?.changed).toEqual(['layout.1.items.0.question'])
    expect(meta.locales?.['ar-TN']?.status).toBe('needs-review')
    expect(meta.sourceHash).not.toBe(enSaved.sourceHash)
  })

  it('saving English without text changes keeps "done"', () => {
    const done: TranslationMeta = { ...enSaved, locales: { ar: { status: 'done', basedOn: enSaved.sourceHash } } }
    const sameText = { ...pageEn(), layout: pageEn().layout.map((b) => ({ ...b, id: b.id })) }
    sameText.layout[0]!.buttons![0]!.url = 'https://example.com/changed' // URLs are not source text
    expect(nextTranslationMeta({ fields: pageFields, previous: done, doc: sameText, locale: 'en', now }).locales?.ar?.status).toBe('done')
  })

  it('a first save with content in a locale starts as "needs review"; without content "missing"', () => {
    expect(nextTranslationMeta({ fields: pageFields, previous: enSaved, doc: { ...pageArEmpty(), title: 'الرئيسية' }, locale: 'ar', now }).locales?.ar?.status).toBe('needs-review')
    expect(nextTranslationMeta({ fields: pageFields, previous: enSaved, doc: pageArEmpty(), locale: 'en-TN', now }).locales?.['en-TN']?.status).toBe('missing')
  })

  it('the hook trusts the stored meta: a save in one locale cannot change another locale', () => {
    const hook = createTranslationStatusHook(pageFields)
    const stored: TranslationMeta = { ...enSaved, locales: { ar: { status: 'needs-review' } } }
    const data = hook({
      data: { ...pageArEmpty(), title: 'الرئيسية', translation: { locales: { ar: { status: 'done' }, 'en-TN': { status: 'done' } } } },
      originalDoc: { ...pageArEmpty(), translation: stored },
      req: { locale: 'ar' } as never,
      context: {},
    })
    const meta = data.translation as TranslationMeta
    expect(meta.locales?.ar?.status).toBe('done')
    expect(meta.locales?.['en-TN']).toBeUndefined()
  })

  it('auto-translate forces "needs review" through the request context', () => {
    const hook = createTranslationStatusHook(pageFields)
    const data = hook({ data: { title: 'x' }, originalDoc: { translation: { ...enSaved, locales: { ar: { status: 'done' } } } }, req: { locale: 'ar' } as never, context: { translationStatus: 'needs-review' } })
    expect((data.translation as TranslationMeta).locales?.ar?.status).toBe('needs-review')
  })
})

describe('translation coverage (dashboard)', () => {
  it('counts Arabic only when Arabic text exists; region locales inherit from their language', () => {
    const ar = { ...pageArEmpty(), title: 'الرئيسية', meta: { description: 'الصفحة' } }
    const arTN = { ...pageArEmpty(), title: 'الرئيسية - تونس' }
    const result = documentProgress(pageFields, { en: pageEn(), ar, 'ar-TN': arTN, 'en-TN': pageArEmpty() }, ['en', 'ar', 'ar-TN', 'en-TN'])
    expect(result.total).toBe(5) // title, rich text, button label, question, description (URL excluded)
    expect(result.perLocale.en).toEqual({ covered: 5, own: 5 })
    expect(result.perLocale.ar).toEqual({ covered: 2, own: 2 })
    expect(result.perLocale['ar-TN']).toEqual({ covered: 2, own: 1 }) // 1 override + 1 inherited from ar
    expect(result.perLocale['en-TN']).toEqual({ covered: 5, own: 0 }) // everything inherited from en
    expect(result.missingPaths.ar).toEqual(['layout.0.content', 'layout.0.buttons.0.label', 'layout.1.items.0.question'])
  })
})
