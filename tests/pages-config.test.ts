import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Pages } from '@/collections/Pages'

const named = (name: string) => Pages.fields.find((f) => 'name' in f && f.name === name) as Field & { blocks: { fields: Field[] }[] }

/** Every object reachable from a config subtree (fields, blocks, options...), functions excluded. */
const objects = (value: unknown, out = new Set<object>()): Set<object> => {
  if (value && typeof value === 'object' && !out.has(value)) {
    out.add(value)
    for (const child of Object.values(value)) objects(child, out)
  }
  return out
}

describe('Pages config', () => {
  it('the shared layout and the per-language layout share no config objects', () => {
    // Payload sanitizes configs in place: if the localized layout shared objects with the shared
    // layout, the shared layout's texts would silently stop being localized.
    const shared = objects(named('layout').blocks)
    const localized = objects(named('localizedLayout').blocks)
    const common = [...shared].filter((o) => localized.has(o))
    expect(common).toHaveLength(0)
  })

  it('only the per-language layout is localized; block texts are localized in both', () => {
    expect((named('layout') as { localized?: boolean }).localized).toBeFalsy()
    expect((named('localizedLayout') as { localized?: boolean }).localized).toBe(true)
    const heroContent = (layout: string) => {
      const hero = named(layout).blocks.find((b) => (b as { slug?: string }).slug === 'hero')!
      const tabs = hero.fields[0] as { tabs: { fields: Field[] }[] }
      return tabs.tabs[0]!.fields.find((f) => 'name' in f && f.name === 'content') as { localized?: boolean }
    }
    expect(heroContent('layout').localized).toBe(true)
    expect(heroContent('localizedLayout').localized).toBe(true)
  })
})
