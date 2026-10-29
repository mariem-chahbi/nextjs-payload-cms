import type { Field, Validate } from 'payload'
import { describe, expect, it } from 'vitest'

import { relaxLocalizedRequired } from '@/plugins/localizedRequired'

const fields: Field[] = [
  { name: 'title', type: 'text', localized: true, required: true },
  { name: 'code', type: 'text', required: true },
  {
    name: 'layout',
    type: 'blocks',
    blocks: [{ slug: 'hero', fields: [{ name: 'heading', type: 'text', localized: true, required: true }] }],
  },
  {
    name: 'localizedLayout',
    type: 'blocks',
    localized: true,
    blocks: [{ slug: 'hero', fields: [{ name: 'heading', type: 'text', required: true }] }],
  },
]

const relaxed = relaxLocalizedRequired(fields)
const validateOf = (field: Field | undefined) => (field as { validate: Validate }).validate
const run = (field: Field | undefined, value: unknown, locale: string) =>
  validateOf(field)(value, {
    req: { locale, t: (key: string) => key, payload: { config: { defaultMaxTextLength: 40_000 } } },
    required: false,
  } as never)

describe('localized required fields', () => {
  const title = relaxed[0]
  const heroHeading = (relaxed[2] as { blocks: { fields: Field[] }[] }).blocks[0]!.fields[0]

  it('are required in the default locale', async () => {
    expect(await run(title, '', 'en')).toMatch(/required/)
    expect(await run(title, 'Home', 'en')).toBe(true)
  })

  it('may stay empty in other locales, which inherit through fallback', async () => {
    expect(await run(title, '', 'ar-TN')).toBe(true)
    expect(await run(heroHeading, undefined, 'ar')).toBe(true)
    expect(await run(heroHeading, undefined, 'en')).toMatch(/required/)
  })

  it('keep the normal type validation', async () => {
    expect((title as { required?: boolean }).required).toBe(false)
    expect(await run(title, 'x'.repeat(100_000), 'ar')).not.toBe(true)
  })

  it('leave non-localized fields and fields inside a localized layout unchanged', () => {
    expect(relaxed[1]).toBe(fields[1])
    expect(relaxed[3]).toBe(fields[3])
  })
})
