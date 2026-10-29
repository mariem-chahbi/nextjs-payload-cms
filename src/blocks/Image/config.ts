import { linkGroup } from '@/fields/link'
import { imageShapeFields } from '@/fields/imageShape'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const ImageBlock = defineBlock({
  slug: 'image',
  interfaceName: 'ImageBlock',
  labels: { singular: l('Image', 'صورة'), plural: l('Images', 'صور') },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: l('Image', 'الصورة'),
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'size',
          type: 'select',
          defaultValue: 'large',
          label: l('Size', 'الحجم'),
          options: ['small', 'medium', 'large', 'full'].map((value) => ({ value, label: value })),
        },
        {
          name: 'align',
          type: 'select',
          defaultValue: 'center',
          label: l('Alignment', 'المحاذاة'),
          options: ['start', 'center', 'end'].map((value) => ({ value, label: value })),
        },
        {
          name: 'rounded',
          type: 'select',
          defaultValue: 'md',
          label: l('Rounded corners', 'زوايا مستديرة'),
          options: ['none', 'sm', 'md', 'lg', 'full'].map((value) => ({ value, label: value })),
        },
        {
          name: 'shadow',
          type: 'select',
          defaultValue: 'none',
          label: l('Shadow', 'الظل'),
          options: ['none', 'sm', 'md', 'lg'].map((value) => ({ value, label: value })),
        },
      ],
    },
    imageShapeFields(),
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: l('Caption', 'التعليق'),
      admin: { description: l("Empty = the image's own caption.", 'فارغ = تعليق الصورة نفسها.') },
    },
    { name: 'enableLink', type: 'checkbox', label: l('Link the image', 'ربط الصورة') },
    { ...linkGroup(), admin: { condition: (_, s) => Boolean(s?.enableLink), hideGutter: true } },
  ],
})
