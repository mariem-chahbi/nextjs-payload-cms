import { APIError, type CollectionConfig, type FieldHook } from 'payload'

import { contentManagers, contentManagersOrTranslatorInLocale, loggedIn, publishedOrLoggedIn } from '@/access/roles'
import { layoutBlocks } from '@/blocks'
import { l } from '@/i18n/labels'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { TAGS } from '@/utilities/cacheTags'
import { copyConfig } from '@/utilities/copyFields'
import { previewURL, sitePathFor } from '@/utilities/preview'
import { joinPath, slugify } from '@/utilities/slugify'

type PageDoc = {
  id: number | string
  title?: string | null
  slug?: string | null
  path?: string | null
  parent?: number | string | { id: number | string } | null
  layout?: unknown[] | null
  localizedLayout?: unknown[] | null
  separateLayoutPerLocale?: boolean | null
}

const relationId = (value: PageDoc['parent']) =>
  value && typeof value === 'object' ? value.id : (value ?? undefined)

/** Slug defaults to the title of the same locale. */
const formatSlug: FieldHook<PageDoc> = ({ value, siblingData }) => {
  if (typeof value === 'string' && value.trim()) return slugify(value)
  if (typeof siblingData?.title === 'string' && siblingData.title.trim()) return slugify(siblingData.title)
  return value
}

/**
 * Localized full path ("company/team"), from the parent's path in the same locale (with fallback).
 * Empty when this locale has no slug of its own: URLs then use the inherited (fallback) path.
 */
const computePath: FieldHook<PageDoc> = async ({ siblingData, originalDoc, req }) => {
  const slug = siblingData?.slug ?? originalDoc?.slug
  if (!slug) return null

  const parentId = relationId(siblingData?.parent ?? originalDoc?.parent)
  let parentPath: string | null | undefined
  if (parentId) {
    if (parentId === originalDoc?.id) throw new APIError('A page cannot be its own parent.', 400, undefined, true)
    const parent = await req.payload.findByID({
      collection: 'pages',
      id: parentId,
      locale: req.locale ?? undefined,
      depth: 0,
      draft: true,
      select: { path: true },
      req,
    })
    parentPath = parent?.path
  }

  const path = joinPath(parentPath, slug)
  const clash = await req.payload.find({
    collection: 'pages',
    where: {
      and: [{ path: { equals: path } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])],
    },
    locale: req.locale ?? undefined,
    depth: 0,
    limit: 1,
    pagination: false,
    req,
  })
  if (clash.docs.length > 0) {
    throw new APIError(`Another page already uses the URL "/${path}" in this language.`, 400, undefined, true)
  }
  return path
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: l('Page', 'صفحة'), plural: l('Pages', 'الصفحات') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    group: l('Content', 'المحتوى'),
    preview: (doc, { locale }) => previewURL(sitePathFor(locale, doc as { path?: string })),
  },
  access: {
    read: publishedOrLoggedIn,
    readVersions: loggedIn,
    create: contentManagers,
    update: contentManagersOrTranslatorInLocale,
    delete: contentManagers,
  },
  defaultPopulate: { title: true, slug: true, path: true },
  versions: {
    maxPerDoc: 50,
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Title', 'العنوان') },
    {
      name: 'separateLayoutPerLocale',
      type: 'checkbox',
      label: l('Different layout per language', 'تخطيط مختلف لكل لغة'),
      admin: {
        description: l(
          'Off: one shared layout, only texts are translated. On: each language has its own blocks (copied from the shared layout; use "Copy to locale" to copy between languages).',
          'إيقاف: تخطيط واحد مشترك وتُترجم النصوص فقط. تشغيل: لكل لغة كتلها الخاصة (منسوخة من التخطيط المشترك؛ استخدم "نسخ إلى اللغة" للنسخ بين اللغات).',
        ),
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: l('Layout', 'التخطيط'),
      // Own copy per blocks field: see utilities/copyFields.ts (Payload mutates configs in place).
      blocks: copyConfig(layoutBlocks),
      admin: { condition: (data) => !data?.separateLayoutPerLocale, initCollapsed: true },
    },
    {
      name: 'localizedLayout',
      type: 'blocks',
      localized: true,
      label: l('Layout for this language', 'التخطيط لهذه اللغة'),
      blocks: copyConfig(layoutBlocks),
      admin: { condition: (data) => Boolean(data?.separateLayoutPerLocale), initCollapsed: true },
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      // URLs are not translated by the tools; an editor may still set an Arabic slug.
      custom: { translate: false },
      index: true,
      label: l('Slug', 'المعرّف في الرابط'),
      admin: {
        position: 'sidebar',
        description: l('Generated from the title when empty.', 'يُولَّد من العنوان إذا كان فارغًا.'),
      },
      hooks: { beforeValidate: [formatSlug] },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      label: l('Parent page', 'الصفحة الأم'),
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: { position: 'sidebar' },
    },
    {
      name: 'path',
      type: 'text',
      localized: true,
      custom: { translate: false },
      index: true,
      label: l('URL path', 'مسار الرابط'),
      admin: { position: 'sidebar', readOnly: true },
      hooks: { beforeChange: [computePath] },
    },
  ],
  hooks: {
    afterDelete: [revalidateCollectionDelete(TAGS.pages)],
    beforeChange: [
      // Turning on "different layout per language" starts this language from the shared layout.
      ({ data }) => {
        const doc = data as PageDoc
        if (doc.separateLayoutPerLocale && (!doc.localizedLayout || doc.localizedLayout.length === 0) && doc.layout?.length) {
          doc.localizedLayout = structuredClone(doc.layout).map((block) => {
            const { id: _id, ...rest } = block as Record<string, unknown>
            return rest
          })
        }
        return doc
      },
    ],
    afterChange: [
      revalidateCollection(TAGS.pages),
      // Children's paths include this page's path. When a published page's path changes, rewrite
      // the descendants' derived `path` directly in the database (no new versions, no re-publish).
      async ({ doc, previousDoc, req }) => {
        if (doc._status !== 'published' || doc.path === previousDoc?.path) return doc
        const locale = req.locale && req.locale !== 'all' ? req.locale : undefined

        const refresh = async (parentId: number | string, parentPath: string | null, depth: number) => {
          if (depth > 10) return
          const children = await req.payload.find({
            collection: 'pages',
            where: { parent: { equals: parentId } },
            locale,
            depth: 0,
            pagination: false,
            select: { slug: true, path: true },
            req,
          })
          for (const child of children.docs as PageDoc[]) {
            const path = child.slug ? joinPath(parentPath, child.slug) : null
            if (path !== child.path) {
              await req.payload.db.updateOne({ collection: "pages", id: child.id, data: { path }, locale, req })
            }
            await refresh(child.id, path, depth + 1)
          }
        }

        await refresh(doc.id, doc.path ?? null, 0)
        return doc
      },
    ],
  },
}
