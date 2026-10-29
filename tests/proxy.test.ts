import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { config, proxy } from '@/proxy'
import { LOCALE_COOKIE, LOCALE_HEADER, negotiateLocale, parseAcceptLanguage } from '@/utilities/getLocale'

const matcher = new RegExp(`^${config.matcher[0]}$`)
const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(new URL(path, 'http://localhost:3000'), { headers })

describe('proxy matcher', () => {
  it.each([
    '/admin',
    '/admin/collections/pages',
    '/api/pages',
    '/api/i18n/ar/common',
    '/next/preview',
    '/next/exit-preview',
    '/_next/static/chunks/app.js',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/images/logo.svg',
  ])('skips %s', (path) => {
    expect(matcher.test(path)).toBe(false)
  })

  it.each(['/', '/about', '/ar', '/ar-TN/about-us', '/administrator-guide', '/apis-explained', '/nextjs-tips'])(
    'runs for page URL %s',
    (path) => {
      expect(matcher.test(path)).toBe(true)
    },
  )
})

describe('proxy redirects', () => {
  it('passes locale URLs through, remembers the locale and forwards it to the page', () => {
    const res = proxy(request('/ar-TN/about-us'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.cookies.get(LOCALE_COOKIE)?.value).toBe('ar-TN')
    expect(res.headers.get('x-middleware-request-' + LOCALE_HEADER)).toBe('ar-TN')
  })

  it('does not rewrite the cookie when it already matches', () => {
    const res = proxy(request('/ar', { cookie: `${LOCALE_COOKIE}=ar` }))
    expect(res.cookies.get(LOCALE_COOKIE)).toBeUndefined()
  })

  it('first visit: detects the locale from Accept-Language and sets the cookie', () => {
    const res = proxy(request('/about?x=1', { 'accept-language': 'ar-TN,ar;q=0.9,en;q=0.8' }))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/ar-TN/about?x=1')
    expect(res.cookies.get(LOCALE_COOKIE)?.value).toBe('ar-TN')
  })

  it('the remembered choice wins over Accept-Language', () => {
    const res = proxy(request('/', { cookie: `${LOCALE_COOKIE}=en-TN`, 'accept-language': 'ar' }))
    expect(res.headers.get('location')).toBe('http://localhost:3000/en-TN')
  })

  it('falls back to the base language, then to English', () => {
    expect(proxy(request('/', { 'accept-language': 'ar-EG' })).headers.get('location')).toBe('http://localhost:3000/ar')
    expect(proxy(request('/', { 'accept-language': 'fr-FR,de' })).headers.get('location')).toBe('http://localhost:3000/en')
    expect(proxy(request('/')).headers.get('location')).toBe('http://localhost:3000/en')
  })

  it('treats an unknown first segment as a page path', () => {
    expect(proxy(request('/fr/page', { 'accept-language': 'en' })).headers.get('location')).toBe(
      'http://localhost:3000/en/fr/page',
    )
  })
})

describe('locale negotiation', () => {
  it('orders Accept-Language by quality', () => {
    expect(parseAcceptLanguage('en;q=0.5, ar-TN, ar;q=0.8, *;q=0.1')).toEqual(['ar-TN', 'ar', 'en'])
  })

  it('ignores an invalid cookie', () => {
    expect(negotiateLocale({ cookie: 'xx', acceptLanguage: 'en-TN' })).toBe('en-TN')
  })
})
