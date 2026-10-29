import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { Plugin } from 'payload'

import { anyone, contentManagers, contentManagersOrTranslatorInLocale } from '@/access/roles'
import { l } from '@/i18n/labels'
import { storagePlugin } from '@/storage'
import { absoluteURL } from '@/utilities/getURL'

import { localizedRequiredPlugin } from './localizedRequired'
import { translationStatusPlugin } from './translationStatus'
import { translatorAccessPlugin } from './translatorAccess'

/**
 * Every plugin is registered here; payload.config.ts only imports `plugins`.
 * Storage settings themselves live in src/storage.ts.
 */
export const plugins: Plugin[] = [
  storagePlugin(),

  // Localized meta title / description / image in an "SEO" tab on pages.
  seoPlugin({
    collections: ['pages'],
    uploadsCollection: 'media',
    tabbedUI: true,
    generateTitle: ({ doc }) => (doc as { title?: string })?.title ?? '',
    generateURL: ({ doc, locale }) => absoluteURL(`${locale ?? 'en'}/${(doc as { path?: string })?.path ?? ''}`),
  }),

  // Forms editors build in the admin; labels and messages are localized by the plugin.
  // Submissions are stored and emailed through the email adapter (Mailpit in dev).
  formBuilderPlugin({
    fields: { payment: false, state: false, country: false },
    redirectRelationships: ['pages'],
    formOverrides: {
      admin: { group: l('Forms', 'النماذج') },
      access: {
        read: anyone,
        create: contentManagers,
        update: contentManagersOrTranslatorInLocale,
        delete: contentManagers,
      },
    },
    formSubmissionOverrides: {
      admin: { group: l('Forms', 'النماذج') },
      access: {
        create: anyone,
        read: contentManagers,
        update: () => false,
        delete: contentManagers,
      },
    },
  }),

  // Per-locale translation status (missing / needs review / done), Translate button, list badges.
  translationStatusPlugin(),

  // Localized "required" fields are required in the default locale only (others inherit).
  localizedRequiredPlugin(),

  // Keep last: applies translator rules to fields added by every plugin above.
  translatorAccessPlugin(),
]
