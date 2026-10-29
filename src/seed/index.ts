/**
 * pnpm seed — resets the content and creates the demo data (idempotent: run it again any time).
 * Uploads go to MinIO through the normal Media/Documents collections.
 */
import path from 'path'
import type { CollectionSlug, Field, GlobalSlug, Payload } from 'payload'
import { getPayload } from 'payload'

import { isEmptyValue } from '../i18n/fallback'
import type { LocaleCode } from '../i18n/locales'
import config from '../payload.config'
import { collectTranslatable, setAtPath } from '../translation/fields'
import { extractTextSegments, replaceTextSegments, setLexicalDirection } from '../translation/lexical'
import { makePdf } from '../utilities/makePdf'

import { aboutLayout, ARABIC, homeLayout, type MediaIds } from './content'
import { doc, h, p, text } from './lexical'

const ASSETS = path.resolve(process.cwd(), 'seed-assets')
/**
 * A NEW context object for every call: Payload uses it as `req.context` as-is, and the storage
 * plugin keeps the uploaded file there. A shared object made every upload after the first one
 * reuse stale data and never reach MinIO.
 */
const ctx = (extra: Record<string, unknown> = {}) => ({ disableRevalidate: true, ...extra })

export const SEED_USERS = [
  { email: 'admin@payload-playground.local', password: 'admin-playground', name: 'Ada Admin', role: 'admin' },
  { email: 'editor@payload-playground.local', password: 'editor-playground', name: 'Eddie Editor', role: 'editor' },
  { email: 'translator@payload-playground.local', password: 'translator-playground', name: 'Tala Translator', role: 'translator' },
  { email: 'viewer@payload-playground.local', password: 'viewer-playground', name: 'Victor Viewer', role: 'viewer' },
] as const

/** Arabic for texts outside the Home page (globals, About/Team, form, media). */
const ARABIC_EXTRA: Record<string, string> = {
  'Payload Playground': 'ساحة تجارب Payload',
  'Edit everything. Translate easily.': 'عدّل كل شيء. ترجم بسهولة.',
  'Page not found': 'الصفحة غير موجودة',
  'The page you are looking for does not exist or was moved.': 'الصفحة التي تبحث عنها غير موجودة أو نُقلت.',
  'Back home': 'العودة إلى الرئيسية',
  'Tunis, Tunisia': 'تونس، تونس',
  'Team': 'الفريق',
  'Our team': 'فريقنا',
  'The people behind the project.': 'الأشخاص وراء المشروع.',
  'Meet the editors, translators and developers.': 'تعرّف على المحررين والمترجمين والمطورين.',
  Contact: 'اتصل بنا',
  Explore: 'استكشف',
  Legal: 'قانوني',
  Privacy: 'الخصوصية',
  Terms: 'الشروط',
  'Built with': 'مبني باستخدام',
  'Payload CMS 3': 'Payload CMS 3',
  'and Next.js.': 'وNext.js.',
  '© {year} payload-playground. All rights reserved.': '© {year} payload-playground. جميع الحقوق محفوظة.',
  'Your name': 'اسمك',
  Email: 'البريد الإلكتروني',
  Message: 'الرسالة',
  'I agree to be contacted': 'أوافق على التواصل معي',
  'Send message': 'إرسال الرسالة',
  'Thank you! We will get back to you soon.': 'شكرًا لك! سنعود إليك قريبًا.',
  'Contact form': 'نموذج التواصل',
  'New contact form message from {{name}}': 'رسالة جديدة من نموذج التواصل من {{name}}',
  '{{name}} ({{email}}) wrote: {{message}}': 'كتب {{name}} ({{email}}): {{message}}',
  'Abstract artwork': 'عمل فني تجريدي',
  'Company logo': 'شعار الشركة',
  'Partner logo': 'شعار شريك',
  'Portrait': 'صورة شخصية',
  'Mandelbrot animation': 'رسوم متحركة لمجموعة ماندلبروت',
  'Video poster': 'صورة غلاف الفيديو',
  'Social sharing image': 'صورة المشاركة',
}
const DICTIONARY = { ...ARABIC, ...ARABIC_EXTRA }

const UI_STRINGS: [string, string, string][] = [
  ['nav.menu', 'Menu', 'القائمة'],
  ['nav.close', 'Close', 'إغلاق'],
  ['switcher.label', 'Region and language', 'المنطقة واللغة'],
  ['a11y.skip', 'Skip to content', 'انتقل إلى المحتوى'],
  ['form.submit', 'Send', 'إرسال'],
  ['form.required', 'This field is required.', 'هذا الحقل مطلوب.'],
  ['form.error', 'Something went wrong. Please try again.', 'حدث خطأ. حاول مرة أخرى.'],
  ['form.sending', 'Sending…', 'جارٍ الإرسال…'],
  ['gallery.close', 'Close', 'إغلاق'],
  ['gallery.previous', 'Previous', 'السابق'],
  ['gallery.next', 'Next', 'التالي'],
  ['cta.start', 'Get started', 'ابدأ الآن'],
  ['footer.madeIn', 'Made in Tunis', 'صُنع في تونس'],
]

// ── helpers ─────────────────────────────────────────────────────────────────────

const log = (message: string) => console.log(`[seed] ${message}`)

/** Arabic version of a document: every translatable text looked up in the dictionary. */
const toArabic = (fields: Field[], en: Record<string, unknown>, missing: Set<string>) => {
  const data = structuredClone(en)
  for (const key of ['id', 'createdAt', 'updatedAt', '_status', 'translation']) delete data[key]
  const lookup = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return value
    const ar = DICTIONARY[trimmed]
    if (ar === undefined) {
      missing.add(trimmed)
      return value
    }
    return `${value.match(/^\s*/)?.[0] ?? ''}${ar}${value.match(/\s*$/)?.[0] ?? ''}`
  }
  for (const entry of collectTranslatable(fields, en)) {
    if (isEmptyValue(entry.value)) continue
    if (!entry.translate) {
      setAtPath(data, entry.path, null) // URLs/phones: inherit from English
    } else if (entry.type === 'richText') {
      setAtPath(data, entry.path, setLexicalDirection(replaceTextSegments(entry.value, extractTextSegments(entry.value).map(lookup)), 'rtl'))
    } else if (typeof entry.value === 'string') {
      setAtPath(data, entry.path, lookup(entry.value))
    }
  }
  return data
}

const fieldsOf = (payload: Payload, kind: 'collection' | 'global', slug: string): Field[] =>
  kind === 'global' ? payload.config.globals.find((g) => g.slug === slug)!.fields : payload.collections[slug as CollectionSlug].config.fields

const translateCollectionDoc = async (payload: Payload, slug: CollectionSlug, id: number, missing: Set<string>, status: 'done' | 'needs-review' = 'done') => {
  const en = (await payload.findByID({ collection: slug, id, locale: 'en', depth: 0, draft: true })) as unknown as Record<string, unknown>
  const drafts = Boolean(payload.collections[slug].config.versions?.drafts)
  await payload.update({
    collection: slug,
    id,
    locale: 'ar',
    data: { ...toArabic(fieldsOf(payload, 'collection', slug), en, missing), ...(drafts ? { _status: 'published' } : {}) } as never,
    context: ctx({ translationStatus: status }),
  })
}

const translateGlobal = async (payload: Payload, slug: GlobalSlug, missing: Set<string>) => {
  const en = (await payload.findGlobal({ slug, locale: 'en', depth: 0, draft: true })) as unknown as Record<string, unknown>
  await payload.updateGlobal({
    slug,
    locale: 'ar',
    data: { ...toArabic(fieldsOf(payload, 'global', slug), en, missing), _status: 'published' } as never,
    context: ctx({ translationStatus: 'done' }),
  })
}

const upload = async (payload: Payload, file: string, alt: string) => {
  const created = await payload.create({ collection: 'media', data: { alt }, filePath: path.join(ASSETS, file), context: ctx() })
  await payload.update({ collection: 'media', id: created.id, locale: 'ar', data: { alt: DICTIONARY[alt] ?? alt }, context: ctx() })
  return created.id as number
}

// ── seed ────────────────────────────────────────────────────────────────────────

const seed = async () => {
  const payload = await getPayload({ config })
  const missing = new Set<string>()

  log('Clearing content…')
  for (const collection of ['pages', 'form-submissions', 'forms', 'translations', 'regions', 'media', 'documents', 'users', 'payload-jobs'] as CollectionSlug[]) {
    await payload.delete({ collection, where: { id: { exists: true } }, context: ctx(), overrideAccess: true })
  }

  log('Users…')
  for (const user of SEED_USERS) await payload.create({ collection: 'users', data: { ...user }, context: ctx() })

  log('Regions…')
  const intl = await payload.create({
    collection: 'regions',
    locale: 'en',
    data: { code: 'intl', name: 'International', country: '', locales: ['en', 'ar'], defaultLocale: 'en', currency: 'USD', dateFormat: 'long', numberFormat: 'latn', timezone: 'UTC', sortOrder: 0, active: true },
    context: ctx(),
  })
  await payload.update({ collection: 'regions', id: intl.id, locale: 'ar', data: { name: 'دولي' }, context: ctx() })
  const tn = await payload.create({
    collection: 'regions',
    locale: 'en',
    data: { code: 'tn', name: 'Tunisia', country: 'TN', locales: ['ar-TN', 'en-TN'], defaultLocale: 'ar-TN', currency: 'TND', dateFormat: 'long', numberFormat: 'latn', timezone: 'Africa/Tunis', sortOrder: 1, active: true },
    context: ctx(),
  })
  await payload.update({ collection: 'regions', id: tn.id, locale: 'ar', data: { name: 'تونس' }, context: ctx() })

  log('Uploading media to MinIO…')
  const m: MediaIds = {}
  for (const [name, file, alt] of [
    ['hero', 'hero.jpg', 'Abstract artwork'],
    ['hero-tunisia', 'hero-tunisia.jpg', 'Abstract artwork'],
    ['feature-1', 'feature-1.jpg', 'Abstract artwork'],
    ['feature-2', 'feature-2.webp', 'Abstract artwork'],
    ['feature-3', 'feature-3.png', 'Abstract artwork'],
    ['gallery-1', 'gallery-1.jpg', 'Abstract artwork'],
    ['gallery-2', 'gallery-2.jpg', 'Abstract artwork'],
    ['gallery-3', 'gallery-3.jpg', 'Abstract artwork'],
    ['gallery-4', 'gallery-4.jpg', 'Abstract artwork'],
    ['avatar-1', 'avatar-1.jpg', 'Portrait'],
    ['avatar-2', 'avatar-2.jpg', 'Portrait'],
    ['avatar-3', 'avatar-3.jpg', 'Portrait'],
    ['social', 'social.jpg', 'Social sharing image'],
    ['logo', 'logo.svg', 'Company logo'],
    ['favicon', 'favicon.png', 'Company logo'],
    ['intro', 'intro.mp4', 'Mandelbrot animation'],
    ['intro-poster', 'intro-poster.jpg', 'Video poster'],
    ...[1, 2, 3, 4, 5].map((n) => [`partner-${n}`, `partner-${n}.svg`, 'Partner logo']),
  ] as [string, string, string][]) {
    m[name] = await upload(payload, file, alt)
  }
  await payload.create({
    collection: 'documents',
    data: { title: 'Sample private PDF' },
    file: (() => {
      const data = makePdf(['payload-playground', 'Private sample document', 'Opened through a short-lived signed URL.'])
      return { data, mimetype: 'application/pdf', name: 'sample-private.pdf', size: data.length }
    })(),
    context: ctx(),
  })

  log('UI strings…')
  for (const [key, en, ar] of UI_STRINGS) {
    const created = await payload.create({ collection: 'translations', locale: 'en', data: { namespace: 'common', key, value: en }, context: ctx() })
    await payload.update({ collection: 'translations', id: created.id, locale: 'ar', data: { value: ar }, context: ctx({ translationStatus: 'done' }) })
  }

  log('Contact form…')
  const form = await payload.create({
    collection: 'forms',
    locale: 'en',
    data: {
      title: 'Contact form',
      fields: [
        { blockType: 'text', name: 'name', label: 'Your name', required: true, width: 50 },
        { blockType: 'email', name: 'email', label: 'Email', required: true, width: 50 },
        { blockType: 'textarea', name: 'message', label: 'Message', required: true, width: 100 },
        { blockType: 'checkbox', name: 'consent', label: 'I agree to be contacted', required: false, defaultValue: false },
      ],
      submitButtonLabel: 'Send message',
      confirmationType: 'message',
      confirmationMessage: doc(p([text('Thank you! We will get back to you soon.', { bold: true })])),
      emails: [
        {
          emailTo: 'team@payload-playground.local',
          subject: 'New contact form message from {{name}}',
          message: doc(p([text('{{name}} ({{email}}) wrote: {{message}}')])),
        },
      ],
    } as never,
    context: ctx(),
  })
  await translateCollectionDoc(payload, 'forms', form.id as number, missing)

  log('Pages…')
  const about = await payload.create({
    collection: 'pages',
    locale: 'en',
    data: { title: 'About', slug: 'about', _status: 'published', layout: aboutLayout(m) as never, meta: { title: 'About this project', description: 'A test bench for Payload CMS 3.' } },
    context: ctx(),
  })
  const team = await payload.create({
    collection: 'pages',
    locale: 'en',
    data: {
      title: 'Team',
      slug: 'team',
      parent: about.id,
      _status: 'published',
      layout: [{ blockType: 'richText', content: doc(h('h1', [text('Our team')]), p([text('The people behind the project.')])) }] as never,
      meta: { description: 'Meet the editors, translators and developers.' },
    },
    context: ctx(),
  })
  await translateCollectionDoc(payload, 'pages', team.id as number, missing)

  const home = await payload.create({
    collection: 'pages',
    locale: 'en',
    data: {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      layout: homeLayout(m, { tunisiaRegion: tn.id as number, contactForm: form.id as number, aboutPage: about.id as number }) as never,
      meta: { title: 'Payload playground home page', description: 'Edit everything, translate easily, by region.', image: m.social },
    },
    context: ctx(),
  })
  await translateCollectionDoc(payload, 'pages', home.id as number, missing)

  // ar-TN: only what differs from Arabic — 2 texts and the hero image.
  const homeArTN = (await payload.findByID({ collection: 'pages', id: home.id, locale: 'ar-TN', fallbackLocale: false as never, depth: 0, draft: true })) as unknown as Record<string, unknown>
  const homeEn = (await payload.findByID({ collection: 'pages', id: home.id, locale: 'en', depth: 0 })) as unknown as Record<string, unknown>
  setAtPath(homeArTN, 'layout.0.content', setLexicalDirection(doc(h('h1', [text('ابنِ '), text('مواقع بالعربي والفرنسي', { italic: true, color: 'theme-accent' }), text(' لتونس')]), p([text('كل شي في الصفحة هذي تنجم تبدّلو من لوحة الإدارة.')])), 'rtl'), homeEn)
  setAtPath(homeArTN, 'layout.0.buttons.0.label', 'يلا نبداو', homeEn)
  setAtPath(homeArTN, 'layout.0.media.image', m['hero-tunisia'], homeEn)
  for (const key of ['id', 'createdAt', 'updatedAt', 'translation']) delete homeArTN[key]
  await payload.update({ collection: 'pages', id: home.id, locale: 'ar-TN', data: { ...homeArTN, _status: 'published' } as never, context: ctx({ translationStatus: 'done' }) })

  log('Globals…')
  await payload.updateGlobal({
    slug: 'theme',
    data: {
      colors: { primary: '#1d4ed8', secondary: '#0f766e', accent: '#f59e0b', background: '#ffffff', surface: '#f4f6fb', text: '#111827', muted: '#6b7280' },
      darkMode: 'off',
      fonts: { latinHeading: 'playfair-display', latinBody: 'inter', arabicHeading: 'cairo', arabicBody: 'tajawal' },
      typography: { baseFontSize: 17, headingScale: '1.25', headingWeight: '700', lineHeight: 1.65 },
      layout: { borderRadius: 'md', buttonStyle: 'rounded', containerWidth: 1200 },
      _status: 'published',
    } as never,
    context: ctx(),
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      siteName: 'Payload Playground',
      tagline: 'Edit everything. Translate easily.',
      homePage: home.id,
      favicon: m.favicon,
      defaultSocialImage: m.social,
      contact: { phone: '+1 555 0100', email: 'hello@payload-playground.local', address: 'Tunis, Tunisia' },
      notFound: { title: 'Page not found', content: doc(p([text('The page you are looking for does not exist or was moved.')])), buttonLabel: 'Back home' },
      _status: 'published',
    } as never,
    context: ctx(),
  })
  await translateGlobal(payload, 'site-settings', missing)
  // Region locales override only the phone number.
  for (const locale of ['ar-TN', 'en-TN'] as LocaleCode[]) {
    await payload.updateGlobal({ slug: 'site-settings', locale, data: { contact: { phone: '+216 71 000 000' }, _status: 'published' } as never, context: ctx({ translationStatus: 'done' }) })
  }

  await payload.updateGlobal({
    slug: 'header',
    locale: 'en',
    data: {
      logo: m.logo,
      logoHeight: 40,
      logoHeightMobile: 32,
      logoPosition: 'start',
      sticky: true,
      transparentOverHero: true,
      showSwitcher: true,
      background: 'theme:background',
      textColor: 'theme:text',
      nav: [
        { label: 'Home', type: 'page', page: home.id },
        { label: 'About', type: 'page', page: about.id, children: [{ label: 'Team', description: 'Meet the editors, translators and developers.', type: 'page', page: team.id }] },
        { label: 'Contact', type: 'url', url: '#contact' },
      ],
      cta: { enabled: true, label: 'Get started', type: 'page', page: about.id, variant: 'primary' },
      _status: 'published',
    } as never,
    context: ctx(),
  })
  await translateGlobal(payload, 'header', missing)

  await payload.updateGlobal({
    slug: 'footer',
    locale: 'en',
    data: {
      columns: [
        { title: 'Explore', links: [{ label: 'Home', type: 'page', page: home.id }, { label: 'About', type: 'page', page: about.id }, { label: 'Team', type: 'page', page: team.id }] },
        { title: 'Legal', links: [{ label: 'Privacy', type: 'url', url: '#privacy' }, { label: 'Terms', type: 'url', url: '#terms' }] },
      ],
      content: doc(p([text('Built with '), text('Payload CMS 3', { bold: true }), text(' and Next.js.')])),
      social: [
        { platform: 'github', url: 'https://github.com/payloadcms/payload' },
        { platform: 'linkedin', url: 'https://www.linkedin.com/company/payloadcms' },
      ],
      copyright: '© {year} payload-playground. All rights reserved.',
      background: 'theme:surface',
      textColor: 'theme:text',
      _status: 'published',
    } as never,
    context: ctx(),
  })
  await translateGlobal(payload, 'footer', missing)

  if (missing.size) {
    throw new Error(`Missing Arabic for:\n  ${[...missing].join('\n  ')}`)
  }

  log('Done.')
  log('Logins (password = role + "-playground"):')
  for (const user of SEED_USERS) log(`  ${user.role.padEnd(10)} ${user.email} / ${user.password}`)
  log(`Pages: /en (home), /en/about (English only), /en/about/team — Arabic: /ar, Tunisia: /ar-TN, /en-TN`)
}

try {
  await seed()
  process.exit(0)
} catch (error) {
  console.error('[seed] FAILED:', error)
  process.exit(1)
}

