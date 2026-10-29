import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const TestimonialsBlock = defineBlock({
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: l('Testimonials', 'آراء العملاء'), plural: l('Testimonials', 'آراء العملاء') },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: l('Heading', 'العنوان') },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      label: l('Layout', 'التخطيط'),
      options: [
        { value: 'grid', label: l('Grid', 'شبكة') },
        { value: 'slider', label: l('Slider', 'شريط متحرك') },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      label: l('Testimonials', 'الآراء'),
      labels: { singular: l('Testimonial', 'رأي'), plural: l('Testimonials', 'آراء') },
      fields: [
        { name: 'quote', type: 'textarea', localized: true, required: true, label: l('Quote', 'الاقتباس') },
        {
          type: 'row',
          fields: [
            { name: 'author', type: 'text', localized: true, required: true, label: l('Name', 'الاسم') },
            { name: 'role', type: 'text', localized: true, label: l('Role / company', 'المنصب / الشركة') },
            { name: 'rating', type: 'number', min: 1, max: 5, label: l('Rating (1–5)', 'التقييم (1–5)') },
          ],
        },
        { name: 'avatar', type: 'upload', relationTo: 'media', label: l('Photo', 'الصورة') },
      ],
    },
  ],
})
