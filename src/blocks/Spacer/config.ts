import { colorField } from '@/fields/color'
import { responsiveNumber } from '@/fields/responsive'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const SpacerBlock = defineBlock({
  slug: 'spacer',
  interfaceName: 'SpacerBlock',
  labels: { singular: l('Spacer / divider', 'مسافة / فاصل'), plural: l('Spacers / dividers', 'مسافات / فواصل') },
  fields: [
    responsiveNumber('height', l('Height (px)', 'الارتفاع (بكسل)'), { min: 0, max: 400, step: 4, defaultValue: 48 }),
    { name: 'showDivider', type: 'checkbox', label: l('Show a line', 'إظهار خط') },
    {
      type: 'row',
      admin: { condition: (_, s) => Boolean(s?.showDivider) },
      fields: [
        {
          name: 'dividerStyle',
          type: 'select',
          defaultValue: 'solid',
          label: l('Line style', 'نمط الخط'),
          options: ['solid', 'dashed', 'dotted'].map((value) => ({ value, label: value })),
        },
        {
          name: 'dividerWidth',
          type: 'select',
          defaultValue: '100',
          label: l('Line width', 'عرض الخط'),
          options: ['25', '50', '75', '100'].map((value) => ({ value, label: `${value}%` })),
        },
        { name: 'dividerThickness', type: 'number', min: 1, max: 8, defaultValue: 1, label: l('Thickness (px)', 'السماكة') },
        colorField({ name: 'dividerColor', label: l('Line color', 'لون الخط'), defaultValue: 'theme:muted' }),
      ],
    },
  ],
})
