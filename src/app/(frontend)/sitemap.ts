import type { MetadataRoute } from 'next'

import { localesFromRegions, type RegionLike } from '@/i18n/regions'
import { getPayload } from '@/utilities/getPayload'
import { getServerSideURL } from '@/utilities/getURL'
import { buildSitemapEntries, type SitemapPage } from '@/utilities/sitemap'

// Built per request: the Docker image is built without a database.
export const dynamic = 'force-dynamic'

/** Every published page in every locale of an active region, with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload()
  const [pages, regions, settings] = await Promise.all([
    payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      locale: 'all',
      pagination: false,
      depth: 0,
      select: { path: true, updatedAt: true },
    }),
    payload.find({ collection: 'regions', where: { active: { equals: true } }, pagination: false, depth: 0 }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])
  return buildSitemapEntries(
    pages.docs as unknown as SitemapPage[],
    localesFromRegions(regions.docs as RegionLike[]),
    getServerSideURL(),
    (settings.homePage as number | null | undefined) ?? null,
  )
}
