import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const FAQBlock = defineBlock({
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: l('FAQ', 'أسئلة شائعة'), plural: l('FAQs', 'أسئلة شائعة') },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: l('Heading', 'العنوان') },
    {
      type: 'row',
      fields: [
        { name: 'openFirst', type: 'checkbox', defaultValue: true, label: l('Open the first question', 'فتح السؤال الأول') },
        { name: 'allowMultiple', type: 'checkbox', label: l('Allow several open', 'السماح بفتح عدة أسئلة') },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      label: l('Questions', 'الأسئلة'),
      labels: { singular: l('Question', 'سؤال'), plural: l('Questions', 'أسئلة') },
      fields: [
        { name: 'question', type: 'text', localized: true, required: true, label: l('Question', 'السؤال') },
        { name: 'answer', type: 'richText', localized: true, label: l('Answer', 'الإجابة') },
      ],
    },
  ],
})
