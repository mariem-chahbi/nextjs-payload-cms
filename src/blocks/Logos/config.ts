import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const LogosBlock = defineBlock({
  slug: 'logos',
  interfaceName: 'LogosBlock',
  labels: { singular: l('Logos strip', 'شريط شعارات'), plural: l('Logos strips', 'أشرطة شعارات') },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: l('Heading', 'العنوان') },
    {
      type: 'row',
      fields: [
        { name: 'grayscale', type: 'checkbox', defaultValue: true, label: l('Grayscale', 'تدرج رمادي') },
        { name: 'autoScroll', type: 'checkbox', label: l('Scroll automatically', 'تمرير تلقائي') },
        { name: 'logoHeight', type: 'number', defaultValue: 40, min: 16, max: 160, label: l('Logo height (px)', 'ارتفاع الشعار') },
      ],
    },
    {
      name: 'logos',
      type: 'array',
      minRows: 1,
      label: l('Logos', 'الشعارات'),
      labels: { singular: l('Logo', 'شعار'), plural: l('Logos', 'شعارات') },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: l('Logo', 'الشعار') },
            { name: 'name', type: 'text', localized: true, label: l('Name', 'الاسم') },
            { name: 'url', type: 'text', label: l('Link', 'الرابط') },
          ],
        },
      ],
    },
  ],
})
