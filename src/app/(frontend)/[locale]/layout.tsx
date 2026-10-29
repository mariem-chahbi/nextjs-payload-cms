import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { AnimationObserver } from '@/components/site/AnimationObserver'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { LivePreviewListener } from '@/components/site/LivePreviewListener'
import { ThemeStyle } from '@/components/site/ThemeStyle'
import { getGlobal } from '@/utilities/data'
import { getLocaleFromParam } from '@/utilities/getLocale'
import { buildGoogleFontsHref, GOOGLE_FONTS_ORIGIN, GOOGLE_FONTS_STATIC_ORIGIN, pickThemeFonts } from '@/utilities/googleFonts'
import { getServerSideURL } from '@/utilities/getURL'
import { asMedia, mediaSrc } from '@/utilities/media'
import { getSiteContext } from '@/utilities/siteContext'

import '../globals.css'

type Props = { children: ReactNode; params: Promise<{ locale: string }> }

// Rendered per request (region cookie, draft mode) and never at build time (no database during `next build`).
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = getLocaleFromParam((await params).locale)
  if (!resolved) return {}
  const settings = await getGlobal('site-settings', resolved.locale)
  const favicon = mediaSrc(asMedia(settings.favicon)?.url)
  const social = mediaSrc(asMedia(settings.defaultSocialImage)?.sizes?.og?.url ?? asMedia(settings.defaultSocialImage)?.url)
  return {
    metadataBase: new URL(getServerSideURL()),
    title: { default: settings.siteName ?? 'payload-playground', template: `%s · ${settings.siteName ?? 'payload-playground'}` },
    description: settings.tagline ?? undefined,
    icons: favicon ? { icon: favicon } : undefined,
    openGraph: social ? { images: [social] } : undefined,
  }
}

/**
 * Root layout of the site (the admin has its own root layout in (payload)).
 * `<html lang dir>` follows the URL locale; fonts and colors come from the Theme global.
 */
export default async function SiteLayout({ children, params }: Props) {
  const resolved = getLocaleFromParam((await params).locale)
  if (!resolved) notFound()
  const { locale, dir } = resolved

  const [theme, header, footer, settings, ctx, draft] = await Promise.all([
    getGlobal('theme', locale),
    getGlobal('header', locale),
    getGlobal('footer', locale),
    getGlobal('site-settings', locale),
    getSiteContext(locale),
    draftMode(),
  ])
  const rtl = dir === 'rtl'
  const { heading, body } = pickThemeFonts(theme.fonts, rtl)
  const fontsHref = buildGoogleFontsHref([heading.value, body.value])

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={GOOGLE_FONTS_ORIGIN} />
        <link rel="preconnect" href={GOOGLE_FONTS_STATIC_ORIGIN} crossOrigin="anonymous" />
        {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
        <ThemeStyle theme={theme} rtl={rtl} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          {ctx.strings['a11y.skip'] ?? 'Skip to content'}
        </a>
        <Header header={header} settings={settings} ctx={ctx} regions={ctx.regions} />
        <main id="main">{children}</main>
        <Footer footer={footer} settings={settings} ctx={ctx} />
        <AnimationObserver />
        {draft.isEnabled ? <LivePreviewListener /> : null}
      </body>
    </html>
  )
}
