import type { Payload } from 'payload'

import type { LocaleCode } from '@/i18n/locales'

/** Site-wide globals shown on the dashboard, in the order of the quick actions. */
export const SITE_GLOBALS = ['site-settings', 'header', 'footer', 'theme'] as const
export type SiteGlobal = (typeof SITE_GLOBALS)[number]

/**
 * published: the visitors see the latest version.
 * changed:   published, but newer draft edits are waiting to be published.
 * draft:     never published (not on the site yet).
 */
export type ContentState = 'published' | 'changed' | 'draft'

/** Payload keeps the last published version in the document itself and newer drafts only in versions. */
export const contentState = (saved: unknown, latest: unknown): ContentState =>
  latest === 'published' ? 'published' : saved === 'published' ? 'changed' : 'draft'

export type OverviewPage = { id: number | string; title: string; path: string; state: ContentState; updatedAt: string }
export type OverviewGlobal = { slug: SiteGlobal; state: ContentState; updatedAt: string }
export type RecentEdit =
  | { kind: 'page'; id: number | string; title: string; state: ContentState; updatedAt: string }
  | { kind: 'global'; slug: SiteGlobal; state: ContentState; updatedAt: string }

export type SiteOverview = {
  /** Pages needing attention (draft / unpublished changes) first, then the most recently edited. */
  pages: OverviewPage[]
  globals: OverviewGlobal[]
  recent: RecentEdit[]
  counts: { pages: number; published: number; changed: number; drafts: number; media: number; documents: number; submissions: number }
  latestSubmissionAt: string | null
  homePageId: number | string | null
  generatedAt: string
}

const STATE_ORDER: Record<ContentState, number> = { draft: 0, changed: 1, published: 2 }
const byNewest = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt)
const RECENT_LIMIT = 6

type Row = { id: number | string; title?: string | null; path?: string | null; _status?: string | null; updatedAt?: string | null }
type GlobalRow = { _status?: string | null; updatedAt?: string | null; homePage?: number | string | { id: number | string } | null }

/** Everything the content dashboard shows, read with system access (only panel users see it). */
export const computeSiteOverview = async (payload: Payload, locale: LocaleCode): Promise<SiteOverview> => {
  const base = { depth: 0, locale, overrideAccess: true } as const
  const [saved, latest, globalsSaved, globalsLatest, media, documents, submissions] = await Promise.all([
    payload.find({ collection: 'pages', ...base, pagination: false, select: { _status: true } }),
    payload.find({
      collection: 'pages',
      ...base,
      draft: true,
      pagination: false,
      select: { title: true, path: true, _status: true, updatedAt: true },
    }),
    Promise.all(SITE_GLOBALS.map((slug) => payload.findGlobal({ slug, ...base }) as Promise<GlobalRow>)),
    Promise.all(SITE_GLOBALS.map((slug) => payload.findGlobal({ slug, ...base, draft: true }) as Promise<GlobalRow>)),
    payload.count({ collection: 'media', overrideAccess: true }),
    payload.count({ collection: 'documents', overrideAccess: true }),
    payload.find({ collection: 'form-submissions', depth: 0, limit: 1, sort: '-createdAt', overrideAccess: true }),
  ])

  const savedStatus = new Map((saved.docs as Row[]).map((doc) => [String(doc.id), doc._status]))
  const pages: OverviewPage[] = (latest.docs as Row[])
    .map((doc) => ({
      id: doc.id,
      title: doc.title || `#${doc.id}`,
      path: doc.path ?? '',
      state: contentState(savedStatus.get(String(doc.id)), doc._status),
      updatedAt: doc.updatedAt ?? '',
    }))
    .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || byNewest(a, b))

  const globals: OverviewGlobal[] = SITE_GLOBALS.map((slug, i) => ({
    slug,
    state: contentState(globalsSaved[i]?._status, globalsLatest[i]?._status),
    updatedAt: globalsLatest[i]?.updatedAt ?? '',
  }))

  const recent: RecentEdit[] = [
    ...pages.map((p) => ({ kind: 'page' as const, id: p.id, title: p.title, state: p.state, updatedAt: p.updatedAt })),
    ...globals.map((g) => ({ kind: 'global' as const, slug: g.slug, state: g.state, updatedAt: g.updatedAt })),
  ]
    .filter((edit) => edit.updatedAt)
    .sort(byNewest)
    .slice(0, RECENT_LIMIT)

  const home = globalsSaved[0]?.homePage
  const latestSubmission = submissions.docs[0] as { createdAt?: string } | undefined
  return {
    pages,
    globals,
    recent,
    counts: {
      pages: pages.length,
      published: pages.filter((p) => p.state === 'published').length,
      changed: pages.filter((p) => p.state === 'changed').length,
      drafts: pages.filter((p) => p.state === 'draft').length,
      media: media.totalDocs,
      documents: documents.totalDocs,
      submissions: submissions.totalDocs,
    },
    latestSubmissionAt: latestSubmission?.createdAt ?? null,
    homePageId: home && typeof home === 'object' ? home.id : (home ?? null),
    generatedAt: new Date().toISOString(),
  }
}
