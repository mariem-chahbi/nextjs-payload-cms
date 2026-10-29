import { BUTTON_VARIANTS, linkFields } from '@/fields/link'
import { perBreakpoint, responsiveNumber } from '@/fields/responsive'
import { imageRatioField } from '@/fields/imageShape'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

/**
 * Canvas with freely positioned items. Positions are % of the canvas, set per breakpoint
 * (tablet/mobile fall back to the larger screen when empty). In RTL the x position can mirror.
 */
export const FreeLayoutBlock = defineBlock({
  slug: 'freeLayout',
  interfaceName: 'FreeLayoutBlock',
  labels: { singular: l('Free layout (canvas)', 'تخطيط حر (لوحة)'), plural: l('Free layouts', 'تخطيطات حرة') },
  fields: [
    responsiveNumber('height', l('Canvas height (px)', 'ارتفاع اللوحة (بكسل)'), {
      min: 100,
      max: 2000,
      step: 10,
      defaultValue: 560,
    }),
    {
      type: 'row',
      fields: [
        {
          name: 'stackOnMobile',
          type: 'checkbox',
          defaultValue: true,
          label: l('Stack items on mobile', 'ترتيب العناصر عموديًا على الجوال'),
        },
        {
          name: 'mirrorInRTL',
          type: 'checkbox',
          defaultValue: true,
          label: l('Mirror in Arabic (RTL)', 'عكس في العربية'),
          admin: { description: l('Flips x positions for right-to-left languages.', 'يعكس المواضع الأفقية للغات من اليمين لليسار.') },
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: l('Items', 'العناصر'),
      labels: { singular: l('Item', 'عنصر'), plural: l('Items', 'عناصر') },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              defaultValue: 'text',
              label: l('Type', 'النوع'),
              options: [
                { value: 'text', label: l('Text', 'نص') },
                { value: 'image', label: l('Image', 'صورة') },
                { value: 'video', label: l('Video', 'فيديو') },
                { value: 'button', label: l('Button', 'زر') },
              ],
            },
            { name: 'name', type: 'text', label: l('Name (admin only)', 'الاسم (للإدارة فقط)') },
          ],
        },
        {
          name: 'text',
          type: 'richText',
          localized: true,
          label: l('Text', 'النص'),
          admin: { condition: (_, s) => s?.type === 'text' },
        },
        {
          type: 'row',
          admin: { condition: (_, s) => s?.type === 'image' || s?.type === 'video' },
          fields: [
            { name: 'media', type: 'upload', relationTo: 'media', label: l('Image or video', 'صورة أو فيديو') },
            {
              name: 'fit',
              type: 'select',
              defaultValue: 'cover',
              label: l('Fit', 'الملاءمة'),
              options: ['cover', 'contain'].map((value) => ({ value, label: value })),
            },
            { name: 'rounded', type: 'checkbox', defaultValue: true, label: l('Rounded', 'مستدير') },
            imageRatioField(),
          ],
        },
        {
          name: 'button',
          type: 'group',
          label: l('Button', 'الزر'),
          admin: { condition: (_, s) => s?.type === 'button' },
          fields: [
            { name: 'label', type: 'text', localized: true, label: l('Label', 'النص') },
            ...linkFields(),
            {
              name: 'variant',
              type: 'select',
              defaultValue: 'primary',
              label: l('Style', 'النمط'),
              options: BUTTON_VARIANTS.map((value) => ({ value, label: value })),
            },
          ],
        },
        perBreakpoint('position', l('Position', 'الموضع'), (bp) => [
          {
            type: 'row',
            fields: [
              {
                name: 'x',
                type: 'number',
                min: -50,
                max: 100,
                defaultValue: bp === 'desktop' ? 10 : undefined,
                label: l('X (%)', 'س (%)'),
                admin: { width: '20%', placeholder: bp === 'desktop' ? undefined : 'inherit' },
              },
              {
                name: 'y',
                type: 'number',
                min: -50,
                max: 100,
                defaultValue: bp === 'desktop' ? 10 : undefined,
                label: l('Y (%)', 'ص (%)'),
                admin: { width: '20%', placeholder: bp === 'desktop' ? undefined : 'inherit' },
              },
              {
                name: 'width',
                type: 'number',
                min: 1,
                max: 100,
                defaultValue: bp === 'desktop' ? 30 : undefined,
                label: l('Width (%)', 'العرض (%)'),
                admin: { width: '20%', placeholder: bp === 'desktop' ? undefined : 'inherit' },
              },
              {
                name: 'zIndex',
                type: 'number',
                min: 0,
                max: 50,
                label: l('Layer', 'الطبقة'),
                admin: { width: '20%', placeholder: bp === 'desktop' ? '1' : 'inherit' },
              },
              {
                name: 'rotate',
                type: 'number',
                min: -180,
                max: 180,
                label: l('Rotate (°)', 'الدوران'),
                admin: { width: '20%', placeholder: bp === 'desktop' ? '0' : 'inherit' },
              },
            ],
          },
        ]),
        {
          name: 'mobileOrder',
          type: 'number',
          min: 0,
          label: l('Order when stacked on mobile', 'الترتيب عند التراص على الجوال'),
        },
      ],
    },
  ],
})
