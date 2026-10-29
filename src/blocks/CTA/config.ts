import { buttonsArray } from '@/fields/link'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const CTABlock = defineBlock({
  slug: 'cta',
  interfaceName: 'CTABlock',
  labels: { singular: l('CTA banner', 'لافتة دعوة'), plural: l('CTA banners', 'لافتات دعوة') },
  fields: [
    { name: 'content', type: 'richText', localized: true, label: l('Content', 'المحتوى') },
    buttonsArray(),
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'centered',
      label: l('Layout', 'التخطيط'),
      options: [
        { value: 'centered', label: l('Centered', 'في الوسط') },
        { value: 'split', label: l('Text and buttons side by side', 'نص وأزرار متجاورة') },
      ],
    },
  ],
})
