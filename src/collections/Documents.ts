import type { CollectionConfig } from 'payload'

import { contentManagers, loggedIn } from '@/access/roles'
import { l } from '@/i18n/labels'

/**
 * Private files. Stored in MinIO under `documents/`. Payload checks `read` access (logged-in users),
 * then redirects to a presigned MinIO URL valid for 5 minutes (see src/storage.ts).
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: l('Document', 'مستند'), plural: l('Documents', 'المستندات') },
  admin: {
    useAsTitle: 'title',
    group: l('Content', 'المحتوى'),
  },
  access: {
    read: loggedIn,
    create: contentManagers,
    update: contentManagers,
    delete: contentManagers,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: l('Title', 'العنوان'),
    },
  ],
  upload: {
    mimeTypes: ['application/pdf'],
  },
}
