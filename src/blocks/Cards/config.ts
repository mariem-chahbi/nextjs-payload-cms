import { linkGroup } from '@/fields/link'
import { responsiveNumber } from '@/fields/responsive'
import { imageShapeFields } from '@/fields/imageShape'
import { l } from '@/i18n/labels'
import { ICON_OPTIONS } from '@/lexical/icons'

import { defineBlock } from '../defineBlock'

export const CardsBlock = defineBlock({
  slug: 'cards',
  interfaceName: 'CardsBlock',
  labels: { singular: l('Cards grid', 'شبكة بطاقات'), plural: l('Cards grids', 'شبكات بطاقات') },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: l('Heading', 'العنوان') },
    { name: 'intro', type: 'textarea', localized: true, label: l('Intro', 'مقدمة') },
    {
      type: 'row',
      fields: [
        {
          name: 'cardStyle',
          type: 'select',
          defaultValue: 'elevated',
          label: l('Card style', 'نمط البطاقة'),
          options: ['elevated', 'bordered', 'flat'].map((value) => ({ value, label: value })),
        },
      ],
    },
    imageShapeFields({ ratio: '16/10' }),
    responsiveNumber('columns', l('Columns', 'الأعمدة'), { min: 1, max: 6, defaultValue: 3 }),
    {
      name: 'cards',
      type: 'array',
      minRows: 1,
      label: l('Cards', 'البطاقات'),
      labels: { singular: l('Card', 'بطاقة'), plural: l('Cards', 'بطاقات') },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', label: l('Image', 'الصورة') },
            { name: 'icon', type: 'select', options: ICON_OPTIONS, label: l('Icon (if no image)', 'أيقونة (بدون صورة)') },
          ],
        },
        { name: 'title', type: 'text', localized: true, required: true, label: l('Title', 'العنوان') },
        { name: 'text', type: 'textarea', localized: true, label: l('Text', 'النص') },
        { name: 'linkLabel', type: 'text', localized: true, label: l('Link label', 'نص الرابط') },
        { ...linkGroup(), admin: { condition: (_, s) => Boolean(s?.linkLabel), hideGutter: true } },
      ],
    },
  ],
})
