import { describe, expect, it, vi } from 'vitest'

import { buildStrings, I18N_CACHE_CONTROL, i18nEndpoint } from '@/endpoints/i18n'

const docs = [
  { key: 'cta.start', value: { en: 'Get started', ar: 'ابدأ', 'ar-TN': 'يلا نبداو' } },
  { key: 'nav.home', value: { en: 'Home', ar: 'الرئيسية' } },
  { key: 'footer.legal', value: { en: 'Legal' } },
  { key: 'only.arabic', value: { ar: 'عربي فقط' } },
]

const call = async (locale: string, ns = 'common', headers: Record<string, string> = {}) => {
  const find = vi.fn().mockResolvedValue({ docs })
  const res = await i18nEndpoint.handler({
    routeParams: { locale, ns },
    headers: new Headers(headers),
    payload: { find },
  } as never)
  return { res, find }
}

describe('UI strings with fallback', () => {
  it('resolves ar-TN → ar → en and reports where each value came from', () => {
    const result = buildStrings(docs, 'ar-TN', 'common')
    expect(result.strings).toEqual({
      'cta.start': 'يلا نبداو',
      'footer.legal': 'Legal',
      'nav.home': 'الرئيسية',
      'only.arabic': 'عربي فقط',
    })
    expect(result.inherited).toEqual({ 'footer.legal': 'en', 'nav.home': 'ar', 'only.arabic': 'ar' })
    expect(result.fallbackChain).toEqual(['ar-TN', 'ar', 'en'])
  })

  it('lists keys missing in every locale of the chain', () => {
    expect(buildStrings(docs, 'en', 'common').missing).toEqual(['only.arabic'])
  })
})

describe('GET /api/i18n/:locale/:ns', () => {
  it('returns strings with Cache-Control and an ETag', async () => {
    const { res, find } = await call('ar')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(I18N_CACHE_CONTROL)
    expect(res.headers.get('ETag')).toMatch(/^".+"$/)
    expect((await res.json()).strings['nav.home']).toBe('الرئيسية')
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ locale: 'all', overrideAccess: false }))
  })

  it('answers 304 when the client already has the same strings', async () => {
    const first = await call('ar')
    const etag = first.res.headers.get('ETag')!
    const { res } = await call('ar', 'common', { 'if-none-match': etag })
    expect(res.status).toBe(304)
    expect(res.headers.get('Cache-Control')).toBe(I18N_CACHE_CONTROL)
  })

  it('rejects unknown locales and invalid namespaces', async () => {
    expect((await call('fr')).res.status).toBe(404)
    expect((await call('ar', '../etc')).res.status).toBe(400)
  })
})
