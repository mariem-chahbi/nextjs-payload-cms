import { buttonsArray } from '@/fields/link'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const ButtonsBlock = defineBlock({
  slug: 'buttons',
  interfaceName: 'ButtonsBlock',
  labels: { singular: l('Buttons', 'أزرار'), plural: l('Buttons', 'أزرار') },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'layout',
          type: 'select',
          defaultValue: 'row',
          label: l('Layout', 'التخطيط'),
          options: [
            { value: 'row', label: l('Side by side', 'متجاورة') },
            { value: 'stack', label: l('Stacked', 'متراصة') },
          ],
        },
        {
          name: 'justify',
          type: 'select',
          defaultValue: 'start',
          label: l('Alignment', 'المحاذاة'),
          options: ['start', 'center', 'end', 'between'].map((value) => ({ value, label: value })),
        },
      ],
    },
    { ...buttonsArray('buttons', 6), minRows: 1 },
  ],
})
