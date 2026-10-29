import type { Field, FieldAccess } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  applyTranslatorFieldAccess,
  createTranslatorGuard,
  structureSignature,
  translatorBeforeOperation,
} from '@/access/translator'

import { mockReq } from './helpers'

/** Page-like schema: shared layout with localized texts inside, nested arrays and blocks. */
const fields: Field[] = [
  { name: 'title', type: 'text', localized: true },
  { name: 'parent', type: 'relationship', relationTo: 'media' },
  {
    name: 'layout',
    type: 'blocks',
    blocks: [
      {
        slug: 'hero',
        fields: [
          { name: 'heading', type: 'text', localized: true },
          { name: 'height', type: 'select', options: ['small', 'large'] },
          {
            name: 'buttons',
            type: 'array',
            fields: [
              { name: 'label', type: 'text', localized: true },
              { name: 'url', type: 'text' },
            ],
          },
        ],
      },
      {
        slug: 'columns',
        fields: [
          {
            name: 'columns',
            type: 'array',
            fields: [
              { name: 'width', type: 'number' },
              {
                name: 'content',
                type: 'blocks',
                blocks: [{ slug: 'text', fields: [{ name: 'body', type: 'text', localized: true }] }],
              },
            ],
          },
        ],
      },
    ],
  },
  { type: 'tabs', tabs: [{ name: 'meta', label: 'SEO', localized: true, fields: [{ name: 'title', type: 'text' }] }] },
]

const original = () => ({
  id: 10,
  title: 'الرئيسية',
  parent: 3,
  _status: 'published',
  layout: [
    {
      id: 'b1',
      blockType: 'hero',
      heading: 'مرحبا',
      height: 'large',
      buttons: [{ id: 'btn1', label: 'ابدأ', url: '/start' }],
    },
    {
      id: 'b2',
      blockType: 'columns',
      columns: [
        { id: 'c1', width: 6, content: [{ id: 't1', blockType: 'text', body: 'نص' }] },
        { id: 'c2', width: 6, content: [{ id: 't2', blockType: 'text', body: 'نص ٢' }] },
      ],
    },
  ],
  meta: { title: 'عنوان' },
})

type Doc = ReturnType<typeof original>

const guard = createTranslatorGuard(fields)

/** Runs the two hooks the way Payload does: beforeOperation sees raw data, beforeChange the stripped data. */
const save = (
  role: Parameters<typeof mockReq>[0],
  locale: string | undefined,
  edit: (doc: Doc) => void,
  { status = 'draft', strippedData }: { status?: string | null; strippedData?: Record<string, unknown> } = {},
) => {
  const req = mockReq(role, locale)
  const { _status: _omit, ...withoutStatus } = original()
  // `null` = the client sent no status at all.
  const incoming: Doc = status === null ? ({ ...withoutStatus } as Doc) : { ...original(), _status: status }
  edit(incoming)
  translatorBeforeOperation({ args: { data: incoming }, operation: 'update', req })
  return guard({ data: strippedData ?? incoming, originalDoc: original(), req })
}

describe('translator structure guard', () => {
  it('lets a translator edit Arabic text (including nested and SEO texts)', () => {
    expect(() =>
      save('translator', 'ar', (doc) => {
        doc.title = 'الصفحة الرئيسية'
        doc.layout[0]!.heading = 'أهلا وسهلا'
        doc.layout[0]!.buttons![0]!.label = 'ابدأ الآن'
        doc.layout[1]!.columns![0]!.content[0]!.body = 'نص جديد'
        doc.meta.title = 'عنوان جديد'
      }),
    ).not.toThrow()
  })

  it.each([
    [
      'adding a block',
      (doc: Doc) => {
        doc.layout.push({ id: 'b3', blockType: 'hero', heading: 'x', height: 'small', buttons: [] })
      },
    ],
    [
      'removing a block',
      (doc: Doc) => {
        doc.layout.pop()
      },
    ],
    [
      'reordering blocks',
      (doc: Doc) => {
        doc.layout.reverse()
      },
    ],
    [
      'changing a block type',
      (doc: Doc) => {
        doc.layout[1]!.blockType = 'hero'
      },
    ],
    [
      'adding an array row inside a block',
      (doc: Doc) => {
        doc.layout[0]!.buttons!.push({ id: 'btn2', label: 'جديد', url: '/x' })
      },
    ],
    [
      'reordering nested blocks inside columns',
      (doc: Doc) => {
        doc.layout[1]!.columns!.reverse()
      },
    ],
    [
      'changing a non-localized value inside a block',
      (doc: Doc) => {
        doc.layout[0]!.height = 'small'
      },
    ],
    [
      'changing a non-localized value deep inside nested blocks',
      (doc: Doc) => {
        doc.layout[1]!.columns![0]!.width = 4
      },
    ],
    [
      'changing a non-localized button URL',
      (doc: Doc) => {
        doc.layout[0]!.buttons![0]!.url = '/elsewhere'
      },
    ],
    [
      'changing the parent page',
      (doc: Doc) => {
        doc.parent = 99
      },
    ],
  ])('rejects %s', (_label, edit) => {
    expect(() => save('translator', 'ar', edit)).toThrow(/Translators can only change translated text/)
  })

  it('rejects a change even after field access already stripped it from `data`', () => {
    const stripped = { ...original(), _status: 'draft' }
    expect(() =>
      save('translator', 'ar', (doc) => (doc.layout[0]!.height = 'small'), { strippedData: stripped }),
    ).toThrow(/layout\[b1\]\.height/)
  })

  it.each(['en', 'all', undefined])('rejects translator writes in locale %s', (locale) => {
    expect(() => save('translator', locale, (doc) => (doc.title = 'Home'))).toThrow(/translation locale/)
  })

  it('rejects a translator publishing', () => {
    expect(() => save('translator', 'ar', (doc) => (doc.title = 'جديد'), { status: 'published' })).toThrow(
      /drafts only/,
    )
  })

  it('treats a save without a draft status as publishing', () => {
    expect(() => save('translator', 'ar', (doc) => (doc.title = 'جديد'), { status: null as never })).toThrow(
      /drafts only/,
    )
  })

  it('rejects translators restoring versions or deleting', () => {
    for (const operation of ['restoreVersion', 'delete']) {
      expect(() => translatorBeforeOperation({ args: {}, operation, req: mockReq('translator', 'ar') })).toThrow()
    }
  })

  it('does not restrict editors or admins', () => {
    for (const role of ['editor', 'admin'] as const) {
      expect(() =>
        save(
          role,
          'en',
          (doc) => {
            doc.layout.reverse()
            doc.parent = 99
          },
          { status: 'published' },
        ),
      ).not.toThrow()
    }
  })

  it('treats populated relations and empty values as unchanged', () => {
    const a = structureSignature(fields, { ...original(), parent: 3 })
    const b = structureSignature(fields, { ...original(), parent: { id: 3, title: 'x' } })
    expect([...a.entries()]).toEqual([...b.entries()])
  })
})

describe('translator field access', () => {
  const withAccess = applyTranslatorFieldAccess(fields)
  const findField = (list: Field[], name: string): Field | undefined => {
    for (const field of list) {
      if ('name' in field && field.name === name) return field
      const children = [
        ...('fields' in field && Array.isArray(field.fields) ? field.fields : []),
        ...('blocks' in field && Array.isArray(field.blocks) ? field.blocks.flatMap((b) => b.fields) : []),
        ...(field.type === 'tabs' ? field.tabs.flatMap((t) => t.fields) : []),
      ]
      const found = findField(children, name)
      if (found) return found
    }
    return undefined
  }
  const canUpdate = (name: string, role: Parameters<typeof mockReq>[0], locale?: string) => {
    const field = findField(withAccess, name) as { access?: { update?: FieldAccess } }
    return field.access!.update!({ req: mockReq(role, locale) } as never)
  }

  it('translators can update localized fields in non-default locales only', async () => {
    expect(await canUpdate('title', 'translator', 'ar')).toBe(true)
    expect(await canUpdate('title', 'translator', 'ar-TN')).toBe(true)
    expect(await canUpdate('title', 'translator', 'en')).toBe(false)
    expect(await canUpdate('title', 'translator', 'all')).toBe(false)
  })

  it('fields inside a localized tab count as localized', async () => {
    const meta = withAccess.find((f) => f.type === 'tabs')!
    const seoTitle = (meta as { tabs: { fields: { access?: { update?: FieldAccess } }[] }[] }).tabs[0]!.fields[0]!
    expect(await seoTitle.access!.update!({ req: mockReq('translator', 'ar') } as never)).toBe(true)
  })

  it('non-localized fields are read-only for translators, open for editors', async () => {
    expect(await canUpdate('parent', 'translator', 'ar')).toBe(false)
    expect(await canUpdate('parent', 'editor', 'en')).toBe(true)
  })

  it('adds no per-field rules inside blocks (Payload runs them on every admin request); the guard protects blocks', () => {
    const layout = withAccess.find((f) => 'name' in f && f.name === 'layout') as { access?: unknown }
    expect(layout).toBe(fields.find((f) => 'name' in f && f.name === 'layout'))
    expect(layout.access).toBeUndefined()
    // …and the structure guard still rejects a change to a shared value inside a block:
    expect(() => save('translator', 'ar', (doc) => (doc.layout[0]!.height = 'small'))).toThrow(/layout\[b1\]\.height/)
  })
})
