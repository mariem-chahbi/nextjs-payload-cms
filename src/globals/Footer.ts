import type { GlobalConfig } from 'payload'

import { colorField } from '@/fields/color'
import { linkFields } from '@/fields/link'
import { l } from '@/i18n/labels'

import { globalAccess, globalHooks, globalVersions } from './shared'

export const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'github', 'whatsapp'] as const

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: l('Footer', 'التذييل'),
  admin: { group: l('Site', 'الموقع') },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
  fields: [
    {
      name: 'columns',
      type: 'array',
      maxRows: 5,
      label: l('Link columns', 'أعمدة الروابط'),
      labels: { singular: l('Column', 'عمود'), plural: l('Columns', 'أعمدة') },
      fields: [
        { name: 'title', type: 'text', localized: true, label: l('Title', 'العنوان') },
        {
          name: 'links',
          type: 'array',
          label: l('Links', 'الروابط'),
          labels: { singular: l('Link', 'رابط'), plural: l('Links', 'روابط') },
          fields: [
            { name: 'label', type: 'text', localized: true, required: true, label: l('Label', 'النص') },
            ...linkFields(),
          ],
        },
      ],
    },
    { name: 'content', type: 'richText', localized: true, label: l('Text', 'النص') },
    {
      name: 'social',
      type: 'array',
      label: l('Social links', 'روابط التواصل'),
      labels: { singular: l('Social link', 'رابط'), plural: l('Social links', 'روابط') },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              label: l('Platform', 'المنصة'),
              options: SOCIAL_PLATFORMS.map((value) => ({ value, label: value })),
            },
            // Localized: a region can link its own account.
            { name: 'url', type: 'text', localized: true, required: true, label: l('URL', 'الرابط'), custom: { translate: false } },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
      label: l('Copyright', 'حقوق النشر'),
      admin: { description: l('{year} is replaced by the current year.', 'يُستبدل {year} بالسنة الحالية.') },
    },
    {
      type: 'row',
      fields: [
        colorField({ name: 'background', label: l('Background', 'الخلفية'), defaultValue: 'theme:surface' }),
        colorField({ name: 'textColor', label: l('Text color', 'لون النص'), defaultValue: 'theme:text' }),
      ],
    },
  ],
}
