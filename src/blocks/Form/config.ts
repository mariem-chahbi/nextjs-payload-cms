import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

/** Embeds a form from the form builder. Submissions are saved and emailed (Mailpit in dev). */
export const FormBlock = defineBlock({
  slug: 'form',
  interfaceName: 'FormBlock',
  labels: { singular: l('Form', 'نموذج'), plural: l('Forms', 'نماذج') },
  fields: [
    { name: 'form', type: 'relationship', relationTo: 'forms', required: true, label: l('Form', 'النموذج') },
    { name: 'heading', type: 'text', localized: true, label: l('Heading', 'العنوان') },
    { name: 'intro', type: 'richText', localized: true, label: l('Intro', 'مقدمة') },
  ],
})
