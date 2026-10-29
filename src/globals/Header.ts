import type { GlobalConfig } from 'payload'

import { colorField } from '@/fields/color'
import { BUTTON_VARIANTS, linkFields } from '@/fields/link'
import { l } from '@/i18n/labels'

import { globalAccess, globalHooks, globalVersions } from './shared'

export const Header: GlobalConfig = {
  slug: 'header',
  label: l('Header', 'الترويسة'),
  admin: { group: l('Site', 'الموقع') },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: l('Logo & layout', 'الشعار والتخطيط'),
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  label: l('Logo', 'الشعار'),
                  filterOptions: { mimeType: { contains: 'image' } },
                },
                {
                  name: 'logoHeight',
                  type: 'number',
                  min: 16,
                  max: 160,
                  defaultValue: 40,
                  label: l('Logo height desktop (px)', 'ارتفاع الشعار - سطح المكتب'),
                },
                {
                  name: 'logoHeightMobile',
                  type: 'number',
                  min: 16,
                  max: 120,
                  defaultValue: 32,
                  label: l('Logo height mobile (px)', 'ارتفاع الشعار - الجوال'),
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'logoPosition',
                  type: 'select',
                  defaultValue: 'start',
                  label: l('Logo position', 'موضع الشعار'),
                  options: [
                    { value: 'start', label: l('Start', 'البداية') },
                    { value: 'center', label: l('Center', 'الوسط') },
                  ],
                },
                { name: 'sticky', type: 'checkbox', defaultValue: true, label: l('Sticky', 'ثابت عند التمرير') },
                {
                  name: 'transparentOverHero',
                  type: 'checkbox',
                  label: l('Transparent over a hero', 'شفاف فوق الواجهة'),
                },
                {
                  name: 'showSwitcher',
                  type: 'checkbox',
                  defaultValue: true,
                  label: l('Region + language switcher', 'محوّل المنطقة واللغة'),
                },
              ],
            },
            {
              type: 'row',
              fields: [
                colorField({ name: 'background', label: l('Background', 'الخلفية'), defaultValue: 'theme:background' }),
                colorField({ name: 'textColor', label: l('Text color', 'لون النص'), defaultValue: 'theme:text' }),
              ],
            },
          ],
        },
        {
          label: l('Navigation', 'القائمة'),
          fields: [
            {
              name: 'nav',
              type: 'array',
              label: l('Menu items', 'عناصر القائمة'),
              labels: { singular: l('Menu item', 'عنصر'), plural: l('Menu items', 'عناصر') },
              fields: [
                { name: 'label', type: 'text', localized: true, required: true, label: l('Label', 'النص') },
                ...linkFields(),
                {
                  name: 'children',
                  type: 'array',
                  label: l('Dropdown items', 'عناصر القائمة المنسدلة'),
                  labels: { singular: l('Dropdown item', 'عنصر'), plural: l('Dropdown items', 'عناصر') },
                  admin: { initCollapsed: true },
                  fields: [
                    { name: 'label', type: 'text', localized: true, required: true, label: l('Label', 'النص') },
                    { name: 'description', type: 'text', localized: true, label: l('Description', 'الوصف') },
                    ...linkFields(),
                  ],
                },
              ],
            },
          ],
        },
        {
          label: l('Call to action', 'زر الدعوة'),
          fields: [
            {
              name: 'cta',
              type: 'group',
              label: false,
              fields: [
                { name: 'enabled', type: 'checkbox', label: l('Show a button', 'إظهار زر') },
                { name: 'label', type: 'text', localized: true, label: l('Label', 'النص') },
                ...linkFields(),
                {
                  name: 'variant',
                  type: 'select',
                  defaultValue: 'primary',
                  label: l('Style', 'النمط'),
                  options: BUTTON_VARIANTS.map((value) => ({ value, label: value })),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
