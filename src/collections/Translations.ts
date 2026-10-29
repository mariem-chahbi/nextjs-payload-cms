import type { CollectionConfig } from 'payload'

import { anyone, contentManagers, contentManagersOrTranslatorInLocale } from '@/access/roles'
import { l } from '@/i18n/labels'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { TAGS } from '@/utilities/cacheTags'

/** UI strings for the site (button labels, form messages...). Served at /api/i18n/:locale/:ns. */
export const Translations: CollectionConfig = {
  slug: 'translations',
  labels: { singular: l('UI string', 'نص واجهة'), plural: l('UI strings', 'نصوص الواجهة') },
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['namespace', 'key', 'value'],
    group: l('Localization', 'الترجمة والمناطق'),
    listSearchableFields: ['key', 'namespace'],
  },
  access: {
    read: anyone,
    create: contentManagers,
    update: contentManagersOrTranslatorInLocale,
    delete: contentManagers,
  },
  indexes: [{ fields: ['namespace', 'key'], unique: true }],
  hooks: {
    afterChange: [revalidateCollection(TAGS.translations)],
    afterDelete: [revalidateCollectionDelete(TAGS.translations)],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'namespace',
          type: 'text',
          required: true,
          index: true,
          defaultValue: 'common',
          label: l('Namespace', 'المجال'),
          validate: (value: unknown) =>
            typeof value === 'string' && /^[a-z0-9-]+$/.test(value) ? true : 'Lowercase letters, digits and dashes.',
        },
        {
          name: 'key',
          type: 'text',
          required: true,
          index: true,
          label: l('Key', 'المفتاح'),
          validate: (value: unknown) =>
            typeof value === 'string' && /^[a-zA-Z0-9_.-]+$/.test(value)
              ? true
              : 'Letters, digits, dots, dashes and underscores.',
        },
      ],
    },
    {
      name: 'value',
      type: 'textarea',
      localized: true,
      label: l('Text', 'النص'),
    },
    {
      name: 'note',
      type: 'text',
      label: l('Note for translators', 'ملاحظة للمترجمين'),
      admin: { description: l('Where the text appears, length limits...', 'مكان ظهور النص، حدود الطول...') },
    },
  ],
}
