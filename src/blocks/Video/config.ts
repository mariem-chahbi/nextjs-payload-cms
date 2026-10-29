import { l } from '@/i18n/labels'

import { defineBlock } from '../defineBlock'

export const VideoBlock = defineBlock({
  slug: 'video',
  interfaceName: 'VideoBlock',
  labels: { singular: l('Video', 'فيديو'), plural: l('Videos', 'فيديوهات') },
  fields: [
    {
      name: 'source',
      type: 'select',
      defaultValue: 'upload',
      label: l('Source', 'المصدر'),
      options: [
        { value: 'upload', label: l('Uploaded file', 'ملف مرفوع') },
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
      ],
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      label: l('Video file', 'ملف الفيديو'),
      filterOptions: { mimeType: { contains: 'video' } },
      admin: { condition: (_, s) => s?.source === 'upload' },
    },
    {
      name: 'url',
      type: 'text',
      label: l('Video URL', 'رابط الفيديو'),
      admin: { condition: (_, s) => s?.source !== 'upload', placeholder: 'https://www.youtube.com/watch?v=…' },
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
        if (siblingData?.source === 'upload') return true
        if (typeof value !== 'string' || !value) return 'Paste the video URL.'
        const ok =
          siblingData?.source === 'youtube'
            ? /(youtube\.com|youtu\.be)\//.test(value)
            : /vimeo\.com\//.test(value)
        return ok ? true : `This does not look like a ${String(siblingData?.source)} URL.`
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      label: l('Poster image', 'صورة الغلاف'),
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { condition: (_, s) => s?.source === 'upload' },
    },
    {
      type: 'row',
      fields: [
        { name: 'autoplay', type: 'checkbox', label: l('Autoplay', 'تشغيل تلقائي') },
        { name: 'loop', type: 'checkbox', label: l('Loop', 'تكرار') },
        { name: 'muted', type: 'checkbox', defaultValue: true, label: l('Muted', 'كتم الصوت') },
        { name: 'controls', type: 'checkbox', defaultValue: true, label: l('Controls', 'أزرار التحكم') },
      ],
    },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: '16/9',
      label: l('Aspect ratio', 'نسبة الأبعاد'),
      options: ['16/9', '21/9', '4/3', '1/1', '9/16'].map((value) => ({ value, label: value })),
    },
    { name: 'caption', type: 'text', localized: true, label: l('Caption', 'التعليق') },
  ],
})
