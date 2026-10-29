import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import { dashboardSections } from '@/components/admin/Dashboard'
import { timeAgo } from '@/components/admin/shared'
import { computeSiteOverview, contentState } from '@/utilities/siteOverview'

describe('content state', () => {
  it.each([
    ['published', 'published', 'published'],
    ['published', 'draft', 'changed'],
    ['draft', 'draft', 'draft'],
    [undefined, 'draft', 'draft'],
  ] as const)('saved %s + latest %s → %s', (saved, latest, expected) => {
    expect(contentState(saved, latest)).toBe(expected)
  })
})

/** Fake Local API: `saved` = what the document holds, `latest` = newest version (draft: true). */
const fakePayload = () => {
  const saved = [
    { id: 1, _status: 'published' },
    { id: 2, _status: 'published' },
    { id: 3, _status: 'draft' },
  ]
  const latest = [
    { id: 1, title: 'Home', path: 'home', _status: 'published', updatedAt: '2026-10-29T08:00:00.000Z' },
    { id: 2, title: 'About', path: 'about', _status: 'draft', updatedAt: '2026-10-29T07:00:00.000Z' },
    { id: 3, title: 'Team', path: 'about/team', _status: 'draft', updatedAt: '2026-10-29T06:00:00.000Z' },
  ]
  const globals = {
    'site-settings': { _status: 'published', updatedAt: '2026-10-29T09:00:00.000Z', homePage: 1 },
    header: { _status: 'published', updatedAt: '2026-10-28T09:00:00.000Z' },
    footer: { _status: 'published', updatedAt: '2026-10-27T09:00:00.000Z' },
    theme: { _status: 'published', updatedAt: '2026-10-26T09:00:00.000Z' },
  } as Record<string, Record<string, unknown>>
  return {
    find: async ({ collection, draft }: { collection: string; draft?: boolean }) => {
      if (collection === 'pages') return { docs: draft ? latest : saved, totalDocs: 3 }
      return { docs: [{ createdAt: '2026-10-29T05:00:00.000Z' }], totalDocs: 4 }
    },
    findGlobal: async ({ slug, draft }: { slug: string; draft?: boolean }) =>
      slug === 'theme' && draft ? { ...globals.theme, _status: 'draft', updatedAt: '2026-10-29T10:00:00.000Z' } : globals[slug],
    count: async ({ collection }: { collection: string }) => ({ totalDocs: collection === 'media' ? 22 : 1 }),
  } as unknown as Payload
}

describe('site overview', () => {
  it('counts pages by state, media, documents and submissions', async () => {
    const overview = await computeSiteOverview(fakePayload(), 'en')
    expect(overview.counts).toEqual({ pages: 3, published: 1, changed: 1, drafts: 1, media: 22, documents: 1, submissions: 4 })
    expect(overview.latestSubmissionAt).toBe('2026-10-29T05:00:00.000Z')
    expect(overview.homePageId).toBe(1)
  })

  it('lists pages needing attention first (never published, then unpublished changes)', async () => {
    const { pages } = await computeSiteOverview(fakePayload(), 'en')
    expect(pages.map((p) => [p.title, p.state])).toEqual([
      ['Team', 'draft'],
      ['About', 'changed'],
      ['Home', 'published'],
    ])
  })

  it('merges pages and site globals into the latest edits, newest first, with draft edits to globals', async () => {
    const { recent, globals } = await computeSiteOverview(fakePayload(), 'en')
    expect(recent.map((e) => (e.kind === 'page' ? e.title : e.slug))).toEqual(['theme', 'site-settings', 'Home', 'About', 'Team', 'header'])
    expect(globals.find((g) => g.slug === 'theme')?.state).toBe('changed')
  })
})

describe('dashboard', () => {
  it('shows content first to admins and editors, translation first to translators', () => {
    expect(dashboardSections({ role: 'admin' })).toEqual(['overview', 'translation-summary'])
    expect(dashboardSections({ role: 'editor' })).toEqual(['overview', 'translation-summary'])
    expect(dashboardSections({ role: 'translator' })).toEqual(['translation-progress', 'overview'])
  })

  it('formats edit times relative to now, in English or Arabic', () => {
    const now = Date.parse('2026-10-29T10:00:00.000Z')
    expect(timeAgo('2026-10-29T09:55:00.000Z', 'en', now)).toBe('5 minutes ago')
    expect(timeAgo('2026-10-28T10:00:00.000Z', 'en', now)).toBe('yesterday')
    expect(timeAgo('2026-10-29T09:55:00.000Z', 'ar', now)).toMatch(/5/)
    expect(timeAgo(null, 'en', now)).toBe('—')
  })
})
