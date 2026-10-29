import { responsiveNumber, spaceOptions } from '@/fields/responsive'
import { imageShapeFields } from '@/fields/imageShape'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const GalleryBlock = defineBlock({
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: l('Gallery', 'معرض صور'), plural: l('Galleries', 'معارض صور') },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'layout',
          type: 'select',
          defaultValue: 'grid',
          label: l('Layout', 'التخطيط'),
          options: [
            { value: 'grid', label: l('Grid', 'شبكة') },
            { value: 'slider', label: l('Slider', 'شريط متحرك') },
          ],
        },
        { name: 'gap', type: 'select', defaultValue: 'md', label: l('Gap', 'المسافة'), options: spaceOptions(false) },
        { name: 'lightbox', type: 'checkbox', defaultValue: true, label: l('Open in lightbox', 'فتح في نافذة عرض') },
      ],
    },
    imageShapeFields({ ratio: '4/3' }),
    responsiveNumber('columns', l('Columns', 'الأعمدة'), { min: 1, max: 6, defaultValue: 3 }),
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      label: l('Images', 'الصور'),
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
        { name: 'caption', type: 'text', localized: true, label: l('Caption', 'التعليق') },
      ],
    },
  ],
})
