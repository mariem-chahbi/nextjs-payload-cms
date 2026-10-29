import type { ArrayField, Field, GroupField } from 'payload'

import { l } from '@/i18n/labels'

export const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'link'] as const
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const

/**
 * Where a link goes: an internal page (URL follows the page's localized path) or a custom URL.
 * The visible label is a separate localized field.
 */
export const linkFields = ({ localizedUrl = true }: { localizedUrl?: boolean } = {}): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'type',
        type: 'select',
        defaultValue: 'page',
        label: l('Link to', 'الرابط إلى'),
        options: [
          { value: 'page', label: l('Page', 'صفحة') },
          { value: 'url', label: l('Custom URL', 'رابط مخصص') },
        ],
        admin: { width: '30%' },
      },
      {
        name: 'page',
        type: 'relationship',
        relationTo: 'pages',
        label: l('Page', 'الصفحة'),
        admin: { width: '45%', condition: (_, sibling) => sibling?.type !== 'url' },
      },
      {
        name: 'url',
        type: 'text',
        label: l('URL', 'الرابط'),
        // Localized: a region can point to its own URL (e.g. a local shop).
        // Not inside rich text, whose JSON is already localized as a whole.
        localized: localizedUrl,
        custom: { translate: false },
        admin: { width: '45%', condition: (_, sibling) => sibling?.type === 'url' },
      },
      {
        name: 'newTab',
        type: 'checkbox',
        label: l('New tab', 'تبويب جديد'),
        admin: { width: '25%', style: { alignSelf: 'flex-end' } },
      },
    ],
  },
]

export const linkGroup = (name = 'link', label: GroupField['label'] = l('Link', 'الرابط')): GroupField => ({
  name,
  type: 'group',
  label,
  admin: { hideGutter: true },
  fields: linkFields(),
})

export const buttonFields = (): Field[] => [
  {
    name: 'label',
    type: 'text',
    localized: true,
    required: true,
    label: l('Label', 'النص'),
  },
  ...linkFields(),
  {
    type: 'row',
    fields: [
      {
        name: 'variant',
        type: 'select',
        defaultValue: 'primary',
        label: l('Style', 'النمط'),
        options: BUTTON_VARIANTS.map((value) => ({ value, label: value })),
        admin: { width: '50%' },
      },
      {
        name: 'size',
        type: 'select',
        defaultValue: 'md',
        label: l('Size', 'الحجم'),
        options: BUTTON_SIZES.map((value) => ({ value, label: value })),
        admin: { width: '50%' },
      },
    ],
  },
]

export const buttonsArray = (name = 'buttons', maxRows = 4): ArrayField => ({
  name,
  type: 'array',
  label: l('Buttons', 'الأزرار'),
  maxRows,
  labels: { singular: l('Button', 'زر'), plural: l('Buttons', 'أزرار') },
  admin: { initCollapsed: true },
  fields: buttonFields(),
})
