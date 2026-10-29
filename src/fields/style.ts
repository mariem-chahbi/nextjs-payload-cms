import type { Field } from 'payload'

import { l } from '@/i18n/labels'

import { colorField } from './color'
import { ALL_FONTS } from './fonts'
import { BREAKPOINT_LABELS, BREAKPOINTS, spaceOptions } from './responsive'

const BACKGROUND_TYPES = ['none', 'color', 'gradient', 'image', 'video'] as const

/**
 * The "Style" tab on every block (stored under `style`). Non-localized: style is shared by every
 * language; layout mirrors automatically in Arabic because the renderer uses logical CSS.
 */
export const styleFields = (): Field[] => [
  {
    type: 'collapsible',
    label: l('Background', 'الخلفية'),
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'background',
        type: 'group',
        label: false,
        fields: [
          {
            name: 'type',
            type: 'select',
            defaultValue: 'none',
            label: l('Type', 'النوع'),
            options: BACKGROUND_TYPES.map((value) => ({ value, label: value })),
          },
          colorField({
            name: 'color',
            label: l('Color', 'اللون'),
            admin: { condition: (_, s) => s?.type === 'color' },
          }),
          {
            type: 'row',
            admin: { condition: (_, s) => s?.type === 'gradient' },
            fields: [
              colorField({ name: 'gradientFrom', label: l('From', 'من') }),
              colorField({ name: 'gradientTo', label: l('To', 'إلى') }),
              {
                name: 'gradientAngle',
                type: 'number',
                defaultValue: 135,
                min: 0,
                max: 360,
                label: l('Angle (°)', 'الزاوية (°)'),
              },
            ],
          },
          {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            label: l('Image', 'الصورة'),
            filterOptions: { mimeType: { contains: 'image' } },
            admin: { condition: (_, s) => s?.type === 'image' },
          },
          {
            name: 'video',
            type: 'upload',
            relationTo: 'media',
            label: l('Video', 'الفيديو'),
            filterOptions: { mimeType: { contains: 'video' } },
            admin: { condition: (_, s) => s?.type === 'video' },
          },
          {
            type: 'row',
            admin: { condition: (_, s) => s?.type === 'image' || s?.type === 'video' },
            fields: [
              colorField({ name: 'overlayColor', label: l('Overlay color', 'لون الطبقة') }),
              {
                name: 'overlayOpacity',
                type: 'number',
                min: 0,
                max: 100,
                defaultValue: 0,
                label: l('Overlay opacity (%)', 'شفافية الطبقة (%)'),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: 'collapsible',
    label: l('Text', 'النص'),
    admin: { initCollapsed: true },
    fields: [
      {
        type: 'row',
        fields: [
          colorField({ name: 'textColor', label: l('Text color', 'لون النص') }),
          {
            name: 'font',
            type: 'select',
            defaultValue: 'inherit',
            label: l('Font', 'الخط'),
            options: [
              { value: 'inherit', label: l('Theme default', 'خط القالب') },
              { value: 'heading', label: l('Theme heading font', 'خط العناوين') },
              { value: 'body', label: l('Theme body font', 'خط النص') },
              ...ALL_FONTS.map((font) => ({ value: font.value, label: font.label })),
            ],
          },
          {
            name: 'textAlign',
            type: 'select',
            defaultValue: 'inherit',
            label: l('Alignment', 'المحاذاة'),
            options: [
              { value: 'inherit', label: l('Default', 'افتراضي') },
              { value: 'start', label: l('Start', 'البداية') },
              { value: 'center', label: l('Center', 'الوسط') },
              { value: 'end', label: l('End', 'النهاية') },
              { value: 'justify', label: l('Justify', 'ضبط') },
            ],
          },
        ],
      },
    ],
  },
  {
    type: 'collapsible',
    label: l('Spacing & width', 'المسافات والعرض'),
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'maxWidth',
        type: 'select',
        defaultValue: 'normal',
        label: l('Max width', 'أقصى عرض'),
        options: [
          { value: 'narrow', label: l('Narrow', 'ضيق') },
          { value: 'normal', label: l('Normal', 'عادي') },
          { value: 'wide', label: l('Wide', 'عريض') },
          { value: 'full', label: l('Full width', 'كامل العرض') },
        ],
      },
      {
        name: 'spacing',
        type: 'group',
        label: false,
        fields: BREAKPOINTS.map((bp) => ({
          name: bp,
          type: 'group' as const,
          label: BREAKPOINT_LABELS[bp],
          fields: [
            {
              type: 'row' as const,
              fields: (
                [
                  ['paddingTop', l('Padding top', 'حشو علوي')],
                  ['paddingBottom', l('Padding bottom', 'حشو سفلي')],
                  ['paddingInline', l('Padding sides', 'حشو جانبي')],
                  ['marginTop', l('Margin top', 'هامش علوي')],
                  ['marginBottom', l('Margin bottom', 'هامش سفلي')],
                ] as const
              ).map(([name, label]) => ({
                name,
                type: 'select' as const,
                label,
                defaultValue: bp === 'desktop' ? (name.startsWith('padding') && name !== 'paddingInline' ? 'lg' : 'none') : 'inherit',
                options: spaceOptions(bp !== 'desktop'),
                admin: { width: '20%' },
              })),
            },
          ],
        })),
      },
    ],
  },
  {
    type: 'collapsible',
    label: l('Visibility', 'الظهور'),
    admin: { initCollapsed: true },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'hideOnMobile', type: 'checkbox', label: l('Hide on mobile', 'إخفاء على الجوال') },
          { name: 'hideOnTablet', type: 'checkbox', label: l('Hide on tablet', 'إخفاء على اللوحي') },
          { name: 'hideOnDesktop', type: 'checkbox', label: l('Hide on desktop', 'إخفاء على سطح المكتب') },
        ],
      },
      {
        name: 'showInRegions',
        type: 'relationship',
        relationTo: 'regions',
        hasMany: true,
        label: l('Show in regions', 'إظهار في المناطق'),
        admin: { description: l('Empty = all regions.', 'فارغ = كل المناطق.') },
      },
    ],
  },
  {
    type: 'collapsible',
    label: l('Advanced', 'متقدم'),
    admin: { initCollapsed: true },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'animation',
            type: 'select',
            defaultValue: 'none',
            label: l('Animation', 'الحركة'),
            options: [
              { value: 'none', label: l('None', 'بدون') },
              { value: 'fade', label: l('Fade in', 'ظهور تدريجي') },
              { value: 'slide-up', label: l('Slide up', 'انزلاق للأعلى') },
              { value: 'slide-start', label: l('Slide from start', 'انزلاق من البداية') },
              { value: 'zoom', label: l('Zoom in', 'تكبير') },
            ],
          },
          {
            name: 'anchorId',
            type: 'text',
            label: l('Anchor id', 'معرّف الرابط'),
            validate: (v: unknown) =>
              !v || (typeof v === 'string' && /^[a-zA-Z][\w-]*$/.test(v)) ? true : 'Letters, digits, - and _ (start with a letter).',
          },
          {
            name: 'cssClass',
            type: 'text',
            label: l('CSS class', 'صنف CSS'),
            validate: (v: unknown) =>
              !v || (typeof v === 'string' && /^[\w\s-]+$/.test(v)) ? true : 'Class names only.',
          },
        ],
      },
    ],
  },
]
