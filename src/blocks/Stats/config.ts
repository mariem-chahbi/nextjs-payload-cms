import { responsiveNumber } from '@/fields/responsive'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

/** Numbers are formatted with Intl using the visitor's region (digits, currency). */
export const StatsBlock = defineBlock({
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: l('Stats', 'أرقام'), plural: l('Stats', 'أرقام') },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: l('Heading', 'العنوان') },
    responsiveNumber('columns', l('Columns', 'الأعمدة'), { min: 1, max: 6, defaultValue: 4 }),
    {
      name: 'stats',
      type: 'array',
      minRows: 1,
      label: l('Numbers', 'الأرقام'),
      labels: { singular: l('Number', 'رقم'), plural: l('Numbers', 'أرقام') },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', type: 'number', required: true, label: l('Value', 'القيمة') },
            {
              name: 'format',
              type: 'select',
              defaultValue: 'number',
              label: l('Format', 'التنسيق'),
              options: [
                { value: 'number', label: l('Number', 'رقم') },
                { value: 'compact', label: l('Compact (12K)', 'مختصر') },
                { value: 'percent', label: l('Percent', 'نسبة مئوية') },
                { value: 'currency', label: l("Currency (region's)", 'عملة المنطقة') },
              ],
            },
            { name: 'decimals', type: 'number', min: 0, max: 4, defaultValue: 0, label: l('Decimals', 'الكسور') },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'prefix', type: 'text', localized: true, label: l('Prefix', 'بادئة') },
            { name: 'suffix', type: 'text', localized: true, label: l('Suffix', 'لاحقة') },
          ],
        },
        { name: 'label', type: 'text', localized: true, required: true, label: l('Label', 'الوصف') },
      ],
    },
  ],
})
