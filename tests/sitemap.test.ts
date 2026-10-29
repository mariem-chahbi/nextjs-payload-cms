import { describe, expect, it } from 'vitest'

import { buildSitemapEntries } from '@/utilities/sitemap'

const pages = [
  { id: 1, path: { en: 'home' }, updatedAt: '2026-10-01T00:00:00.000Z' },
  { id: 2, path: { en: 'about-us', ar: 'من-نحن' } },
  { id: 3, path: { ar: 'عروض' } },
]

describe('sitemap', () => {
  const entries = buildSitemapEntries(pages, ['en', 'ar', 'ar-TN', 'en-TN'], 'http://localhost:3000/', 1)

  it('lists each page once per locale', () => {
    expect(entries.filter((e) => e.url.includes('/about-us') || e.url.includes('من-نحن'))).toHaveLength(4)
  })

  it('home page lives at /<locale>', () => {
    expect(entries.find((e) => e.url === 'http://localhost:3000/ar-TN')?.priority).toBe(1)
  })

  it('alternates list every language version, inherited paths included (hreflang)', () => {
    const about = entries.find((e) => e.url === 'http://localhost:3000/en/about-us')
    expect(about?.alternates?.languages).toEqual({
      en: 'http://localhost:3000/en/about-us',
      ar: 'http://localhost:3000/ar/من-نحن',
      'ar-TN': 'http://localhost:3000/ar-TN/من-نحن',
      'en-TN': 'http://localhost:3000/en-TN/about-us',
      'x-default': 'http://localhost:3000/en/about-us',
    })
  })

  it('skips locales where a page has no path at all, and picks another x-default', () => {
    const offer = entries.filter((e) => e.url.includes('عروض'))
    expect(offer.map((e) => e.url)).toEqual(['http://localhost:3000/ar/عروض', 'http://localhost:3000/ar-TN/عروض'])
    expect(offer[0]?.alternates?.languages?.['x-default']).toBe('http://localhost:3000/ar/عروض')
  })

  it('keeps lastModified', () => {
    expect(entries.find((e) => e.url === 'http://localhost:3000/en')?.lastModified).toEqual(new Date('2026-10-01T00:00:00.000Z'))
  })
})
