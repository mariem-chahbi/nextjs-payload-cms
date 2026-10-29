import type { CollectionSlug, Field, GlobalSlug, Payload, PayloadRequest } from 'payload'

import type { LocaleCode } from '@/i18n/locales'

import type { TranslationStatus } from './status'

/**
 * A translatable document: a page, a UI string, or a global.
 * Key format (used in URLs, exports and imports): "collection:pages:12", "global:header".
 */
export type EntityRef = { kind: 'collection'; slug: CollectionSlug; id: string } | { kind: 'global'; slug: GlobalSlug }

export const TRANSLATABLE_GLOBALS = ['site-settings', 'header', 'footer', 'theme'] as const

export const entityKey = (ref: EntityRef) => (ref.kind === 'global' ? `global:${ref.slug}` : `collection:${ref.slug}:${ref.id}`)

export const parseEntityKey = (key: string): EntityRef | undefined => {
  const [kind, slug, id] = key.split(':')
  if (kind === 'global' && slug) return { kind, slug: slug as GlobalSlug }
  if (kind === 'collection' && slug && id) return { kind, slug: slug as CollectionSlug, id }
  return undefined
}

export const getEntityFields = (payload: Payload, ref: EntityRef): Field[] | undefined => {
  if (ref.kind === 'global') return payload.config.globals.find((g) => g.slug === ref.slug)?.fields
  return payload.collections[ref.slug]?.config.fields
}

const hasDrafts = (payload: Payload, ref: EntityRef): boolean => {
  const versions =
    ref.kind === 'global'
      ? payload.config.globals.find((g) => g.slug === ref.slug)?.versions
      : payload.collections[ref.slug]?.config.versions
  return Boolean(versions && typeof versions === 'object' && versions.drafts)
}

/** The document in exactly one locale (no fallback), latest draft included, as the given user. */
export const loadEntityDoc = async (
  payload: Payload,
  ref: EntityRef,
  locale: LocaleCode,
  req: PayloadRequest,
  { overrideAccess = false }: { overrideAccess?: boolean } = {},
): Promise<Record<string, unknown>> => {
  const common = {
    locale,
    fallbackLocale: false as unknown as LocaleCode,
    depth: 0,
    draft: hasDrafts(payload, ref),
    overrideAccess,
    user: req.user,
  }
  if (ref.kind === "global") return (await payload.findGlobal({ slug: ref.slug, ...common })) as unknown as Record<string, unknown>
  return (await payload.findByID({ collection: ref.slug, id: ref.id, ...common })) as unknown as Record<string, unknown>
}

/**
 * Saves one locale of a document as the request user (access rules and translator guard apply).
 * Pages/globals are saved as a draft unless a content manager asks to publish.
 */
export const saveEntityDoc = async ({
  payload,
  ref,
  locale,
  data,
  req,
  publish = false,
  status,
}: {
  payload: Payload
  ref: EntityRef
  locale: LocaleCode
  data: Record<string, unknown>
  req: PayloadRequest
  publish?: boolean
  status?: TranslationStatus
}) => {
  const drafts = hasDrafts(payload, ref)
  const body = { ...data }
  delete body.updatedAt
  delete body.createdAt
  if (drafts) body._status = publish ? 'published' : 'draft'
  const common = {
    locale,
    data: body,
    draft: drafts && !publish,
    depth: 0,
    overrideAccess: false,
    user: req.user,
    context: status ? { translationStatus: status } : {},
  }
  if (ref.kind === 'global') return payload.updateGlobal({ slug: ref.slug, ...common } as never)
  return payload.update({ collection: ref.slug, id: ref.id, ...common } as never)
}

/** Every translatable document, with a human title (for the dashboard and exports). */
export const listTranslatableEntities = async (
  payload: Payload,
  req: PayloadRequest,
  { overrideAccess = false }: { overrideAccess?: boolean } = {},
) => {
  const pages = await payload.find({
    collection: 'pages',
    depth: 0,
    pagination: false,
    draft: true,
    locale: 'en',
    overrideAccess,
    user: req.user,
    select: { title: true },
  })
  return [
    ...pages.docs.map((p) => ({ ref: { kind: 'collection', slug: 'pages', id: String(p.id) } as EntityRef, title: `Page: ${p.title ?? p.id}` })),
    ...TRANSLATABLE_GLOBALS.map((slug) => ({ ref: { kind: 'global', slug } as EntityRef, title: `Global: ${slug}` })),
  ]
}
