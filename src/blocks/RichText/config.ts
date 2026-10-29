import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const RichTextBlock = defineBlock({
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: l('Rich text', 'نص منسق'), plural: l('Rich texts', 'نصوص منسقة') },
  fields: [
    { name: 'content', type: 'richText', localized: true, required: true, label: l('Content', 'المحتوى') },
    {
      name: 'textColumns',
      type: 'select',
      defaultValue: '1',
      label: l('Text columns (desktop)', 'أعمدة النص (سطح المكتب)'),
      options: ['1', '2', '3'].map((value) => ({ value, label: value })),
    },
  ],
})
