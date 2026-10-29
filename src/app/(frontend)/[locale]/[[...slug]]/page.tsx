import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { type AnyBlock, RenderBlocks } from '@/blocks/RenderBlocks'
import { collectBlockFonts } from '@/blocks/fonts'
import { LOCALE_CODES } from '@/i18n/locales'
import { getPageByPath, getPagePaths } from '@/utilities/data'
import { getLocaleFromParam } from '@/utilities/getLocale'
import { buildGoogleFontsHref } from '@/utilities/googleFonts'
import { asMedia, mediaSrc } from '@/utilities/media'
import { getSiteContext } from '@/utilities/siteContext'

type Props = { params: Promise<{ locale: string; slug?: string[] }> }

export const dynamic = 'force-dynamic'

const toPath = (slug: string[] | undefined) => (slug ?? []).map((part) => decodeURIComponent(part)).join('/')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const resolved = getLocaleFromParam(raw)
  if (!resolved) return {}
  const page = await getPageByPath(toPath(slug), resolved.locale)
  if (!page) return {}

  const ctx = await getSiteContext(resolved.locale)
  const paths = await getPagePaths(page.id)
  const isHome = String(page.id) === String(ctx.homePageId)
  const languages: Record<string, string> = {}
  for (const code of LOCALE_CODES) {
    if (!ctx.regions.some((r) => (r.locales ?? []).includes(code))) continue
    languages[code] = isHome ? `/${code}` : `/${code}/${paths[code] ?? paths.en ?? page.path ?? ''}`
  }
  const image = asMedia(page.meta?.image)
  return {
    title: page.meta?.title || page.title,
    description: page.meta?.description ?? undefined,
    alternates: { languages: { ...languages, 'x-default': languages.en ?? '/en' } },
    openGraph: image ? { images: [mediaSrc(image.sizes?.og?.url ?? image.url)!] } : undefined,
  }
}

export default async function Page({ params }: Props) {
  const { locale: raw, slug } = await params
  const resolved = getLocaleFromParam(raw)
  if (!resolved) notFound()

  const page = await getPageByPath(toPath(slug), resolved.locale)
  if (!page) notFound()

  const ctx = await getSiteContext(resolved.locale)
  const blocks = (page.separateLayoutPerLocale ? page.localizedLayout : page.layout) as AnyBlock[] | null | undefined
  // Fonts chosen in a block's Style tab (beyond the theme fonts) — React hoists this <link> into <head>.
  const extraFonts = buildGoogleFontsHref(collectBlockFonts(blocks))

  return (
    <>
      {extraFonts ? <link rel="stylesheet" href={extraFonts} precedence="default" /> : null}
      <RenderBlocks blocks={blocks} ctx={ctx} />
    </>
  )
}
