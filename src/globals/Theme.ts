import type { Field, GlobalConfig } from 'payload'

import { colorField } from '@/fields/color'
import { ARABIC_FONTS, DEFAULT_FONTS, fontOptions, LATIN_FONTS } from '@/fields/fonts'
import { DEFAULT_COLORS } from '@/fields/themeDefaults'
import { l } from '@/i18n/labels'

import { globalAccess, globalHooks, globalVersions } from './shared'

export { DEFAULT_COLORS }

const COLOR_LABELS = {
  primary: l('Primary', 'الأساسي'),
  secondary: l('Secondary', 'الثانوي'),
  accent: l('Accent', 'اللون المميز'),
  background: l('Background', 'الخلفية'),
  surface: l('Surface (cards, sections)', 'الأسطح (البطاقات، الأقسام)'),
  text: l('Text', 'النص'),
  muted: l('Muted text', 'نص خافت'),
}

const colorGroup = (mode: 'light' | 'dark'): Field[] => [
  {
    type: 'row',
    fields: (Object.keys(DEFAULT_COLORS[mode]) as (keyof typeof COLOR_LABELS)[]).map((key) =>
      colorField({
        name: key,
        label: COLOR_LABELS[key],
        hexOnly: true,
        required: true,
        defaultValue: DEFAULT_COLORS[mode][key],
        admin: { width: '33%' },
      }),
    ),
  },
]

/**
 * Site-wide look. Output as CSS variables by <ThemeStyle>; the site CSS contains no colors or fonts.
 */
export const Theme: GlobalConfig = {
  slug: 'theme',
  label: l('Theme', 'المظهر'),
  admin: { group: l('Site', 'الموقع') },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: l('Colors', 'الألوان'),
          fields: [
            { name: 'colors', type: 'group', label: l('Light', 'فاتح'), fields: colorGroup('light') },
            {
              name: 'darkMode',
              type: 'select',
              defaultValue: 'off',
              label: l('Dark mode', 'الوضع الداكن'),
              options: [
                { value: 'off', label: l('Off (always light)', 'إيقاف (فاتح دائمًا)') },
                { value: 'system', label: l("Follow the visitor's device", 'حسب جهاز الزائر') },
                { value: 'on', label: l('Always dark', 'داكن دائمًا') },
              ],
            },
            {
              name: 'darkColors',
              type: 'group',
              label: l('Dark', 'داكن'),
              admin: { condition: (data) => data?.darkMode !== 'off' },
              fields: colorGroup('dark'),
            },
          ],
        },
        {
          label: l('Typography', 'الخطوط'),
          fields: [
            {
              name: 'fonts',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'latinHeading',
                      type: 'select',
                      required: true,
                      defaultValue: DEFAULT_FONTS.latinHeading,
                      label: l('Headings (Latin)', 'العناوين (لاتيني)'),
                      options: fontOptions(LATIN_FONTS),
                    },
                    {
                      name: 'latinBody',
                      type: 'select',
                      required: true,
                      defaultValue: DEFAULT_FONTS.latinBody,
                      label: l('Body (Latin)', 'النص (لاتيني)'),
                      options: fontOptions(LATIN_FONTS),
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'arabicHeading',
                      type: 'select',
                      required: true,
                      defaultValue: DEFAULT_FONTS.arabicHeading,
                      label: l('Headings (Arabic)', 'العناوين (عربي)'),
                      options: fontOptions(ARABIC_FONTS),
                    },
                    {
                      name: 'arabicBody',
                      type: 'select',
                      required: true,
                      defaultValue: DEFAULT_FONTS.arabicBody,
                      label: l('Body (Arabic)', 'النص (عربي)'),
                      options: fontOptions(ARABIC_FONTS),
                    },
                  ],
                },
              ],
            },
            {
              name: 'typography',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'baseFontSize',
                      type: 'number',
                      min: 12,
                      max: 24,
                      defaultValue: 17,
                      required: true,
                      label: l('Base size (px)', 'الحجم الأساسي (بكسل)'),
                    },
                    {
                      name: 'headingScale',
                      type: 'select',
                      defaultValue: '1.25',
                      required: true,
                      label: l('Heading scale', 'تدرج العناوين'),
                      options: [
                        { value: '1.125', label: l('Subtle (1.125)', 'خفيف (1.125)') },
                        { value: '1.2', label: l('Minor third (1.2)', 'معتدل (1.2)') },
                        { value: '1.25', label: l('Major third (1.25)', 'متوسط (1.25)') },
                        { value: '1.333', label: l('Perfect fourth (1.333)', 'واضح (1.333)') },
                        { value: '1.5', label: l('Bold (1.5)', 'قوي (1.5)') },
                      ],
                    },
                    {
                      name: 'headingWeight',
                      type: 'select',
                      defaultValue: '700',
                      label: l('Heading weight', 'سماكة العناوين'),
                      options: ['400', '500', '600', '700'].map((value) => ({ value, label: value })),
                    },
                    {
                      name: 'lineHeight',
                      type: 'number',
                      min: 1.1,
                      max: 2.2,
                      defaultValue: 1.65,
                      admin: { step: 0.05 },
                      label: l('Line height', 'ارتفاع السطر'),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: l('Shapes & layout', 'الأشكال والتخطيط'),
          fields: [
            {
              name: 'layout',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'borderRadius',
                      type: 'select',
                      defaultValue: 'md',
                      label: l('Corner radius', 'استدارة الزوايا'),
                      options: [
                        { value: 'none', label: l('Square', 'حادة') },
                        { value: 'sm', label: l('Small', 'صغيرة') },
                        { value: 'md', label: l('Medium', 'متوسطة') },
                        { value: 'lg', label: l('Large', 'كبيرة') },
                        { value: 'xl', label: l('Extra large', 'كبيرة جدًا') },
                      ],
                    },
                    {
                      name: 'buttonStyle',
                      type: 'select',
                      defaultValue: 'rounded',
                      label: l('Button shape', 'شكل الأزرار'),
                      options: [
                        { value: 'square', label: l('Square', 'مربع') },
                        { value: 'rounded', label: l('Rounded (follows corners)', 'مستدير (حسب الزوايا)') },
                        { value: 'pill', label: l('Pill', 'كبسولة') },
                      ],
                    },
                    {
                      name: 'containerWidth',
                      type: 'number',
                      min: 720,
                      max: 1800,
                      defaultValue: 1200,
                      required: true,
                      admin: { step: 20 },
                      label: l('Content width (px)', 'عرض المحتوى (بكسل)'),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
