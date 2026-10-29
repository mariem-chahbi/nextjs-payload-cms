import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Documents } from './collections/Documents'
import { Media, MEDIA_MAX_BYTES } from './collections/Media'
import { Pages } from './collections/Pages'
import { Regions } from './collections/Regions'
import { Translations } from './collections/Translations'
import { Users } from './collections/Users'
import { i18nEndpoint } from './endpoints/i18n'
import { statsEndpoint } from './endpoints/stats'
import { translationEndpoints } from './endpoints/translation'
import { getEnv } from './env'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { SiteSettings } from './globals/SiteSettings'
import { Theme } from './globals/Theme'
import { DEFAULT_LOCALE, LOCALES } from './i18n/locales'
import { defaultEditor } from './lexical/editor'
import { migrations } from './migrations'
import { plugins } from './plugins'
import { getActiveRegionLocales } from './utilities/activeLocales'
import { previewURL, sitePathFor } from './utilities/preview'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Validate the environment before anything else: a bad config (e.g. an AWS endpoint) stops startup here.
const env = getEnv()

const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · payload-playground',
    },
    // The site re-renders on every autosave (0.8 s), so the preview follows the editor while typing.
    livePreview: {
      collections: ['pages'],
      globals: ['site-settings', 'theme', 'header', 'footer'],
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 390, height: 844 },
        { name: 'tablet', label: 'Tablet', width: 820, height: 1180 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
      url: ({ data, locale, collectionConfig }) =>
        previewURL(sitePathFor(locale.code, collectionConfig?.slug === 'pages' ? (data as { path?: string }) : null)),
    },
    // Custom admin components, registered by path (pnpm generate:importmap).
    components: {
      beforeDashboard: ['/components/admin/Dashboard#Dashboard'],
      afterNavLinks: ['/components/admin/TranslationNavLinks#TranslationNavLinks'],
      views: {
        translate: {
          Component: '/components/admin/TranslationView#TranslationView',
          path: '/translate/:kind/:slug/:id?',
        },
        uiStrings: {
          Component: '/components/admin/UIStringsGrid#UIStringsView',
          path: '/ui-strings',
        },
        translationTools: {
          Component: '/components/admin/TranslationToolsView#TranslationToolsView',
          path: '/translation-tools',
        },
        translationProgress: {
          Component: '/components/admin/TranslationProgressView#TranslationProgressView',
          path: '/translation-progress',
        },
      },
    },
  },

  // Admin UI languages. Arabic switches the whole panel to RTL.
  i18n: {
    supportedLanguages: { en, ar },
    fallbackLanguage: 'en',
  },

  // Content locales. Region locales inherit: ar-TN → ar → en, en-TN → en.
  localization: {
    locales: LOCALES.map((locale) => ({
      code: locale.code,
      label: { en: locale.label, ar: locale.nativeLabel },
      rtl: locale.rtl,
      fallbackLocale: locale.fallbackLocale.length ? [...locale.fallbackLocale] : undefined,
    })),
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
    // Only locales used by an active region are offered in the admin (cached; expired on region saves).
    filterAvailableLocales: async ({ locales, req }) => {
      try {
        const allowed = new Set<string>(await getActiveRegionLocales(req.payload))
        return locales.filter((locale) => allowed.has(locale.code))
      } catch {
        return locales // e.g. before the first migration
      }
    },
  },

  collections: [Pages, Media, Documents, Regions, Translations, Users],
  globals: [SiteSettings, Theme, Header, Footer],
  endpoints: [statsEndpoint, i18nEndpoint, ...translationEndpoints],

  editor: defaultEditor,
  secret: env.PAYLOAD_SECRET,
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    // Dev: schema follows the config automatically. Prod/Docker: committed migrations only.
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
    // Production (Docker app): apply committed migrations when the server starts.
    prodMigrations: migrations,
  }),

  // Forgot-password and form emails. Mailpit catches everything in dev (UI on :8025).
  email: nodemailerAdapter({
    defaultFromAddress: env.SMTP_FROM_ADDRESS,
    defaultFromName: env.SMTP_FROM_NAME,
    skipVerify: true,
    transportOptions: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    },
  }),

  // Runs scheduled publish jobs every minute (pnpm dev and the Docker app), never during `next build`.
  jobs: {
    autoRun: [{ cron: '* * * * *', queue: 'default', limit: 20 }],
    shouldAutoRun: () => !isBuild && process.env.NODE_ENV !== 'test',
    access: {
      run: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin',
    },
  },

  upload: {
    limits: { fileSize: MEDIA_MAX_BYTES },
  },

  sharp,
  plugins,
})
