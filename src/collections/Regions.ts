import type { CollectionConfig } from 'payload'

import { anyone, contentManagers } from '@/access/roles'
import { l } from '@/i18n/labels'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { TAGS } from '@/utilities/cacheTags'
import { LOCALES } from '@/i18n/locales'

const localeOptions = LOCALES.map((locale) => ({ value: locale.code, label: `${locale.label} (${locale.code})` }))

const isValidTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/**
 * A region groups existing locales with local formatting rules. Creating one is data only:
 * it immediately shows up in the admin locale selector and the site switcher.
 */
export const Regions: CollectionConfig = {
  slug: 'regions',
  labels: { singular: l('Region', 'منطقة'), plural: l('Regions', 'المناطق') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'locales', 'currency', 'active'],
    group: l('Localization', 'الترجمة والمناطق'),
  },
  access: {
    read: anyone,
    create: contentManagers,
    update: contentManagers,
    delete: contentManagers,
  },
  defaultSort: 'sortOrder',
  hooks: {
    afterChange: [revalidateCollection(TAGS.regions)],
    afterDelete: [revalidateCollectionDelete(TAGS.regions)],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: l('Code', 'الرمز'),
          admin: { description: l('Short id, e.g. "intl" or "tn".', 'معرّف قصير مثل "intl" أو "tn".') },
          validate: (value: unknown) =>
            typeof value === 'string' && /^[a-z0-9-]{2,20}$/.test(value)
              ? true
              : 'Use 2–20 lowercase letters, digits or dashes.',
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          label: l('Name', 'الاسم'),
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'country',
          type: 'text',
          label: l('Country (ISO code)', 'الدولة (رمز ISO)'),
          admin: { description: l('Two letters, e.g. TN. Empty for international.', 'حرفان مثل TN. اتركه فارغًا للدولي.') },
          validate: (value: unknown) =>
            !value || (typeof value === 'string' && /^[A-Z]{2}$/.test(value)) ? true : 'Use a 2-letter code such as TN.',
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          label: l('Order in switcher', 'الترتيب في المحوّل'),
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'locales',
          type: 'select',
          hasMany: true,
          required: true,
          // Without this the hasMany table would be `regions_locales`, which collides with the
          // table Payload uses for this collection's localized fields.
          dbName: 'region_locale_codes',
          enumName: 'enum_region_locale_codes',
          options: localeOptions,
          label: l('Languages', 'اللغات'),
        },
        {
          name: 'defaultLocale',
          type: 'select',
          required: true,
          options: localeOptions,
          label: l('Default language', 'اللغة الافتراضية'),
          validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
            const locales = Array.isArray(siblingData?.locales) ? (siblingData.locales as string[]) : []
            return typeof value === 'string' && locales.includes(value)
              ? true
              : 'The default language must be one of the selected languages.'
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'currency',
          type: 'text',
          required: true,
          defaultValue: 'USD',
          label: l('Currency', 'العملة'),
          validate: (value: unknown) =>
            typeof value === 'string' && /^[A-Z]{3}$/.test(value) ? true : 'Use a 3-letter ISO code such as TND.',
        },
        {
          name: 'dateFormat',
          type: 'select',
          required: true,
          defaultValue: 'long',
          label: l('Date format', 'تنسيق التاريخ'),
          options: [
            { value: 'short', label: l('Short (29/10/2026)', 'قصير') },
            { value: 'medium', label: l('Medium (29 Oct 2026)', 'متوسط') },
            { value: 'long', label: l('Long (29 October 2026)', 'طويل') },
            { value: 'full', label: l('Full (Thursday, 29 October 2026)', 'كامل') },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'numberFormat',
          type: 'select',
          required: true,
          defaultValue: 'latn',
          label: l('Digits', 'الأرقام'),
          options: [
            { value: 'latn', label: l('Latin (0123)', 'لاتينية (0123)') },
            { value: 'arab', label: l('Arabic-Indic (٠١٢٣)', 'هندية عربية (٠١٢٣)') },
          ],
        },
        {
          name: 'timezone',
          type: 'text',
          required: true,
          defaultValue: 'UTC',
          label: l('Time zone', 'المنطقة الزمنية'),
          admin: { description: l('IANA name, e.g. Africa/Tunis.', 'اسم IANA مثل Africa/Tunis.') },
          validate: (value: unknown) =>
            typeof value === 'string' && isValidTimeZone(value) ? true : 'Unknown time zone (e.g. Africa/Tunis).',
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: l('Active', 'مفعّلة'),
      admin: { position: 'sidebar' },
    },
  ],
}
