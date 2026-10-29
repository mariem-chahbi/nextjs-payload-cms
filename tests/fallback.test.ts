import { describe, expect, it } from 'vitest'

import { isEmptyValue, resolveWithFallback } from '@/i18n/fallback'
import { getDirection, getFallbackChain } from '@/i18n/locales'
import { isVisibleInRegion, localesFromRegions, regionDefaultLocale, resolveRegion } from '@/i18n/regions'

describe('fallback chain', () => {
  it('ar-TN → ar → en and en-TN → en', () => {
    expect(getFallbackChain('ar-TN')).toEqual(['ar-TN', 'ar', 'en'])
    expect(getFallbackChain('en-TN')).toEqual(['en-TN', 'en'])
    expect(getFallbackChain('ar')).toEqual(['ar', 'en'])
    expect(getFallbackChain('en')).toEqual(['en'])
  })

  it('a region locale stores only what differs and inherits the rest', () => {
    const price = { en: '$10', ar: '١٠ دولار', 'ar-TN': '٣٠ دينار' }
    const heading = { en: 'Welcome', ar: 'مرحبا' }
    const tagline = { en: 'Hello' }

    expect(resolveWithFallback(price, 'ar-TN')).toEqual({ value: '٣٠ دينار', source: 'ar-TN', inherited: false })
    expect(resolveWithFallback(heading, 'ar-TN')).toEqual({ value: 'مرحبا', source: 'ar', inherited: true })
    expect(resolveWithFallback(tagline, 'ar-TN')).toEqual({ value: 'Hello', source: 'en', inherited: true })
    expect(resolveWithFallback(heading, 'en-TN')).toEqual({ value: 'Welcome', source: 'en', inherited: true })
    expect(resolveWithFallback({}, 'ar')).toEqual({ value: undefined, source: undefined, inherited: false })
  })

  it('empty strings and empty rich text count as missing', () => {
    expect(resolveWithFallback({ en: 'A', ar: '  ' }, 'ar').source).toBe('en')
    const emptyLexical = { root: { children: [{ type: 'paragraph', children: [] }] } }
    expect(isEmptyValue(emptyLexical)).toBe(true)
    expect(isEmptyValue({ root: { children: [{ children: [{ text: 'x', type: 'text' }] }] } })).toBe(false)
  })

  it('Arabic locales are right-to-left', () => {
    expect(getDirection('ar')).toBe('rtl')
    expect(getDirection('ar-TN')).toBe('rtl')
    expect(getDirection('en')).toBe('ltr')
    expect(getDirection('en-TN')).toBe('ltr')
  })
})

const intl = { code: 'intl', active: true, locales: ['en', 'ar'], defaultLocale: 'en', sortOrder: 0 }
const tn = { code: 'tn', active: true, locales: ['ar-TN', 'en-TN'], defaultLocale: 'ar-TN', sortOrder: 1 }

describe('regions', () => {
  it('available locales come from active regions only (default locale always kept)', () => {
    expect(localesFromRegions([intl, tn])).toEqual(['en', 'ar', 'ar-TN', 'en-TN'])
    expect(localesFromRegions([intl, { ...tn, active: false }])).toEqual(['en', 'ar'])
    expect(localesFromRegions([])).toEqual(['en'])
  })

  it('finds the region of a locale, preferring the remembered region when it offers that locale', () => {
    const ma = { code: 'ma', active: true, locales: ['ar', 'en'], defaultLocale: 'ar', sortOrder: 2 }
    expect(resolveRegion([intl, tn, ma], 'ar-TN')?.code).toBe('tn')
    expect(resolveRegion([intl, tn, ma], 'ar')?.code).toBe('intl')
    expect(resolveRegion([intl, tn, ma], 'ar', 'ma')?.code).toBe('ma')
    expect(resolveRegion([intl, tn, ma], 'ar', 'tn')?.code).toBe('intl')
  })

  it('region default locale must be one of its locales', () => {
    expect(regionDefaultLocale(tn)).toBe('ar-TN')
    expect(regionDefaultLocale({ ...tn, defaultLocale: 'en' })).toBe('ar-TN')
  })

  it('blocks with "show in regions" are filtered; empty means everywhere', () => {
    expect(isVisibleInRegion([], 'intl')).toBe(true)
    expect(isVisibleInRegion(null, undefined)).toBe(true)
    expect(isVisibleInRegion([{ code: 'tn' }], 'tn')).toBe(true)
    expect(isVisibleInRegion([{ code: 'tn' }], 'intl')).toBe(false)
    expect(isVisibleInRegion(['tn'], 'tn')).toBe(true)
  })
})
