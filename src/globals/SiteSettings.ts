import type { GlobalConfig } from 'payload'

import { l } from '@/i18n/labels'

import { globalAccess, globalHooks, globalVersions } from './shared'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: l('Site settings', 'إعدادات الموقع'),
  admin: { group: l('Site', 'الموقع') },
  access: globalAccess,
  versions: globalVersions,
  hooks: globalHooks,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: l('General', 'عام'),
          fields: [
            { name: 'siteName', type: 'text', localized: true, required: true, label: l('Site name', 'اسم الموقع') },
            { name: 'tagline', type: 'text', localized: true, label: l('Tagline', 'الشعار النصي') },
            {
              name: 'homePage',
              type: 'relationship',
              relationTo: 'pages',
              label: l('Home page', 'الصفحة الرئيسية'),
              admin: { description: l('Shown at /<language>.', 'تظهر في /<اللغة>.') },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'favicon',
                  type: 'upload',
                  relationTo: 'media',
                  label: l('Favicon', 'أيقونة الموقع'),
                  filterOptions: { mimeType: { contains: 'image' } },
                },
                {
                  name: 'defaultSocialImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: l('Default social image', 'صورة المشاركة الافتراضية'),
                  filterOptions: { mimeType: { contains: 'image' } },
                },
              ],
            },
          ],
        },
        {
          label: l('Contact', 'التواصل'),
          description: l(
            'Region locales can override these (e.g. a local phone number in ar-TN / en-TN).',
            'يمكن للغات المناطق تخصيصها (مثل رقم هاتف محلي في ar-TN / en-TN).',
          ),
          fields: [
            {
              name: 'contact',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'phone', type: 'text', localized: true, label: l('Phone', 'الهاتف'), custom: { translate: false } },
                    { name: 'email', type: 'email', localized: true, label: l('Email', 'البريد الإلكتروني') },
                  ],
                },
                { name: 'address', type: 'textarea', localized: true, label: l('Address', 'العنوان') },
              ],
            },
          ],
        },
        {
          label: l('404 page', 'صفحة 404'),
          fields: [
            {
              name: 'notFound',
              type: 'group',
              label: false,
              fields: [
                { name: 'title', type: 'text', localized: true, label: l('Title', 'العنوان') },
                { name: 'content', type: 'richText', localized: true, label: l('Message', 'الرسالة') },
                { name: 'buttonLabel', type: 'text', localized: true, label: l('Button label', 'نص الزر') },
              ],
            },
          ],
        },
      ],
    },
  ],
}
