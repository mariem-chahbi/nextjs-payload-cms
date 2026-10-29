import type { Condition, Field, SelectField } from 'payload'

import { l } from '@/i18n/labels'

/** Shapes an image can be shown in. "original" keeps the uploaded proportions. */
export const IMAGE_RATIOS = ['original', '21/9', '16/9', '16/10', '3/2', '4/3', '1/1', '4/5', '3/4', '9/16'] as const
export type ImageRatio = (typeof IMAGE_RATIOS)[number]
export type ImageFit = 'cover' | 'contain'

export const imageRatioField = (defaultValue: ImageRatio = 'original'): SelectField => ({
  name: 'imageRatio',
  type: 'select',
  defaultValue,
  label: l('Image shape', 'شكل الصورة'),
  options: IMAGE_RATIOS.map((value) => ({
    value,
    label: value === 'original' ? l('Original', 'الأصلي') : value.replace('/', ':'),
  })),
  admin: {
    description: l(
      'Any uploaded image is shown in this shape, cropped around its focal point (set it in Media).',
      'تُعرض أي صورة مرفوعة بهذا الشكل، مقصوصة حول نقطة التركيز (اضبطها في الوسائط).',
    ),
  },
})

export const imageFitField = (defaultValue: ImageFit = 'cover'): SelectField => ({
  name: 'imageFit',
  type: 'select',
  defaultValue,
  label: l('Image fit', 'ملاءمة الصورة'),
  options: [
    { value: 'cover', label: l('Fill the shape (crop)', 'ملء الشكل (قص)') },
    { value: 'contain', label: l('Show the whole image', 'إظهار الصورة كاملة') },
  ],
  admin: { condition: (_, sibling) => sibling?.imageRatio !== 'original' },
})

/** Shape + fit side by side. */
export const imageShapeFields = (
  { ratio = 'original', fit = 'cover', condition }: { ratio?: ImageRatio; fit?: ImageFit; condition?: Condition } = {},
): Field => ({
  type: 'row',
  admin: condition ? { condition } : undefined,
  fields: [imageRatioField(ratio), imageFitField(fit)],
})
