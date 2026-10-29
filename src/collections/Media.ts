import { APIError, type CollectionConfig } from 'payload'

import { anyone, contentManagers, contentManagersOrTranslatorInLocale } from '@/access/roles'
import { l } from '@/i18n/labels'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { TAGS } from '@/utilities/cacheTags'

export const MEDIA_MAX_BYTES = 200 * 1024 * 1024

export const MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'video/mp4',
  'video/webm',
]

/** Public images and videos. Stored in MinIO under `media/` (see src/storage.ts). */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: l('Media', 'وسائط'), plural: l('Media', 'الوسائط') },
  admin: {
    group: l('Content', 'المحتوى'),
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize'],
  },
  access: {
    read: anyone,
    create: contentManagers,
    update: contentManagersOrTranslatorInLocale,
    delete: contentManagers,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      label: l('Alternative text', 'النص البديل'),
      admin: { description: l('Describes the image for screen readers and search engines.', 'يصف الصورة لقارئات الشاشة ومحركات البحث.') },
    },
    {
      name: 'caption',
      type: 'textarea',
      localized: true,
      label: l('Caption', 'التعليق'),
    },
  ],
  hooks: {
    afterDelete: [revalidateCollectionDelete(TAGS.media)],
    afterChange: [revalidateCollection(TAGS.media)],
    beforeValidate: [
      // Server uploads: `req.file`; browser uploads to MinIO (clientUploads): `data.filesize`.
      ({ data, req }) => {
        const size = req.file?.size ?? (typeof data?.filesize === 'number' ? data.filesize : 0)
        if (size > MEDIA_MAX_BYTES) {
          throw new APIError('Files must be 200 MB or smaller.', 413, undefined, true)
        }
        return data
      },
    ],
  },
  upload: {
    mimeTypes: MEDIA_MIME_TYPES,
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'mobile', width: 768 },
      { name: 'tablet', width: 1280 },
      { name: 'desktop', width: 1920 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
}
