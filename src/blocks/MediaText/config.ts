import { buttonsArray } from '@/fields/link'
import { imageShapeFields } from '@/fields/imageShape'
import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const MediaTextBlock = defineBlock({
  slug: 'mediaText',
  interfaceName: 'MediaTextBlock',
  labels: { singular: l('Media + text', 'وسائط ونص'), plural: l('Media + text', 'وسائط ونص') },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true, label: l('Image or video', 'صورة أو فيديو') },
    {
      type: 'row',
      fields: [
        {
          name: 'mediaPosition',
          type: 'select',
          defaultValue: 'start',
          label: l('Media position', 'موضع الوسائط'),
          options: [
            { value: 'start', label: l('Start', 'البداية') },
            { value: 'end', label: l('End', 'النهاية') },
            { value: 'top', label: l('Top', 'أعلى') },
            { value: 'bottom', label: l('Bottom', 'أسفل') },
          ],
        },
        {
          name: 'verticalAlign',
          type: 'select',
          defaultValue: 'center',
          label: l('Vertical alignment', 'المحاذاة العمودية'),
          options: ['start', 'center', 'end'].map((value) => ({ value, label: value })),
        },
        {
          name: 'ratio',
          type: 'select',
          defaultValue: '1/2',
          label: l('Media share', 'حصة الوسائط'),
          options: ['1/3', '1/2', '2/3'].map((value) => ({ value, label: value })),
        },
        { name: 'roundedMedia', type: 'checkbox', defaultValue: true, label: l('Rounded media', 'وسائط مستديرة') },
      ],
    },
    imageShapeFields(),
    { name: 'content', type: 'richText', localized: true, label: l('Text', 'النص') },
    buttonsArray(),
  ],
})
