import { colorField } from '@/fields/color'
import { buttonsArray } from '@/fields/link'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const CONTENT_POSITIONS = [
  'top-start',
  'top-center',
  'top-end',
  'middle-start',
  'middle-center',
  'middle-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
] as const

export const HeroBlock = defineBlock({
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: l('Hero', 'واجهة رئيسية'), plural: l('Heroes', 'واجهات رئيسية') },
  fields: [
    { name: 'content', type: 'richText', localized: true, label: l('Content', 'المحتوى') },
    buttonsArray(),
    {
      type: 'row',
      fields: [
        {
          name: 'height',
          type: 'select',
          defaultValue: 'large',
          label: l('Height', 'الارتفاع'),
          options: [
            { value: 'auto', label: l('Fit content', 'حسب المحتوى') },
            { value: 'small', label: l('Small (40%)', 'صغير (40%)') },
            { value: 'medium', label: l('Medium (60%)', 'متوسط (60%)') },
            { value: 'large', label: l('Large (80%)', 'كبير (80%)') },
            { value: 'full', label: l('Full screen', 'ملء الشاشة') },
          ],
        },
        {
          name: 'contentPosition',
          type: 'select',
          defaultValue: 'middle-center',
          label: l('Content position', 'موضع المحتوى'),
          options: CONTENT_POSITIONS.map((value) => ({ value, label: value })),
          admin: { description: l('start/end follow the reading direction.', 'البداية/النهاية تتبع اتجاه القراءة.') },
        },
        {
          name: 'contentWidth',
          type: 'select',
          defaultValue: 'normal',
          label: l('Content width', 'عرض المحتوى'),
          options: ['narrow', 'normal', 'wide'].map((value) => ({ value, label: value })),
        },
      ],
    },
    {
      name: 'media',
      type: 'group',
      label: l('Hero background', 'خلفية الواجهة'),
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'color',
          label: l('Type', 'النوع'),
          options: ['color', 'image', 'video'].map((value) => ({ value, label: value })),
        },
        colorField({
          name: 'color',
          label: l('Color', 'اللون'),
          defaultValue: 'theme:primary',
          admin: { condition: (_, s) => s?.type === 'color' },
        }),
        {
          name: 'image',
          type: 'upload',
          // Localized: a region can show its own hero image (ar-TN overrides, ar inherits en).
          localized: true,
          relationTo: 'media',
          label: l('Image', 'الصورة'),
          filterOptions: { mimeType: { contains: 'image' } },
          admin: { condition: (_, s) => s?.type === 'image' },
        },
        {
          type: 'row',
          admin: { condition: (_, s) => s?.type === 'video' },
          fields: [
            {
              name: 'video',
              type: 'upload',
              localized: true,
              relationTo: 'media',
              label: l('Video', 'الفيديو'),
              filterOptions: { mimeType: { contains: 'video' } },
            },
            {
              name: 'poster',
              type: 'upload',
              localized: true,
              relationTo: 'media',
              label: l('Poster image', 'صورة الغلاف'),
              filterOptions: { mimeType: { contains: 'image' } },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            colorField({ name: 'overlayColor', label: l('Overlay color', 'لون الطبقة'), defaultValue: 'theme:text' }),
            {
              name: 'overlayOpacity',
              type: 'number',
              min: 0,
              max: 100,
              defaultValue: 30,
              label: l('Overlay opacity (%)', 'شفافية الطبقة (%)'),
            },
          ],
        },
      ],
    },
  ],
})
