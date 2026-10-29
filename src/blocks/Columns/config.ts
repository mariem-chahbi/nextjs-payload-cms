import type { Block } from 'payload'

import { responsiveNumber, spaceOptions } from '@/fields/responsive'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

/** 1–4 columns on a 12-column grid; each column holds its own blocks. */
export const columnsBlock = (nestedBlocks: Block[]) =>
  defineBlock({
    slug: 'columns',
    interfaceName: 'ColumnsBlock',
    labels: { singular: l('Columns', 'أعمدة'), plural: l('Columns', 'أعمدة') },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'gap',
            type: 'select',
            defaultValue: 'lg',
            label: l('Gap', 'المسافة'),
            options: spaceOptions(false),
          },
          {
            name: 'verticalAlign',
            type: 'select',
            defaultValue: 'stretch',
            label: l('Vertical alignment', 'المحاذاة العمودية'),
            options: ['start', 'center', 'end', 'stretch'].map((value) => ({ value, label: value })),
          },
        ],
      },
      {
        name: 'columns',
        type: 'array',
        minRows: 1,
        maxRows: 4,
        label: l('Columns', 'الأعمدة'),
        labels: { singular: l('Column', 'عمود'), plural: l('Columns', 'أعمدة') },
        fields: [
          responsiveNumber('width', l('Width (of 12)', 'العرض (من 12)'), {
            min: 1,
            max: 12,
            defaultValue: 6,
            description: l('Empty tablet/mobile = same as the larger screen. Mobile defaults to full width.', 'فارغ = مثل الشاشة الأكبر. الجوال افتراضيًا بعرض كامل.'),
          }),
          {
            name: 'mobileOrder',
            type: 'number',
            min: 0,
            max: 10,
            label: l('Order on mobile', 'الترتيب على الجوال'),
            admin: { description: l('Lower shows first. Empty = normal order.', 'الأصغر يظهر أولاً. فارغ = الترتيب العادي.') },
          },
          {
            name: 'content',
            type: 'blocks',
            label: l('Column content', 'محتوى العمود'),
            blocks: nestedBlocks,
          },
        ],
      },
    ],
  })
