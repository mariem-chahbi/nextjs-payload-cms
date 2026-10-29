import { describe, expect, it } from 'vitest'

import { itemVars } from '@/blocks/FreeLayout/Component'
import { swapLocaleInPath } from '@/components/site/RegionLanguageSwitcher'
import { logicalAlign } from '@/components/site/RichText'
import { buildSwitcherGroups } from '@/components/site/switcherOptions'
import { formatDate, formatNumber } from '@/i18n/format'
import { getLocaleFromParam } from '@/utilities/getLocale'

describe('RTL on Arabic routes', () => {
  it.each([
    ['ar', 'rtl'],
    ['ar-TN', 'rtl'],
    ['en', 'ltr'],
    ['en-TN', 'ltr'],
  ])('/%s → <html dir="%s">', (locale, dir) => {
    expect(getLocaleFromParam(locale)).toEqual({ locale, dir })
  })

  it('rejects unknown locale segments', () => {
    expect(getLocaleFromParam('fr')).toBeUndefined()
  })

  it('rich-text alignment is logical: left → start, right → end', () => {
    expect(logicalAlign('left')).toBe('start')
    expect(logicalAlign('right')).toBe('end')
    expect(logicalAlign('center')).toBe('center')
    expect(logicalAlign('')).toBeUndefined()
  })

  it('free layout mirrors rotation in RTL (x mirrors through inset-inline-start)', () => {
    const item = { position: { desktop: { x: 10, y: 5, width: 40, rotate: 8 }, tablet: { x: 20 }, mobile: {} } }
    expect(itemVars(item as never, false)).toMatchObject({ '--x-d': '10%', '--x-t': '20%', '--r-d': '8deg' })
    expect(itemVars(item as never, true)).toMatchObject({ '--x-d': '10%', '--r-d': '-8deg' })
    expect(itemVars(item as never, false)).not.toHaveProperty('--x-m')
  })
})

describe('Region + Language switcher', () => {
  const regions = [
    { code: 'tn', active: true, sortOrder: 1, locales: ['ar-TN', 'en-TN'], name: { en: 'Tunisia', ar: 'تونس' } },
    { code: 'intl', active: true, sortOrder: 0, locales: ['en', 'ar'], name: { en: 'International', ar: 'دولي' } },
    { code: 'off', active: false, locales: ['en'], name: { en: 'Hidden' } },
  ]

  it('groups languages by active region, names in the page language, languages in their own script', () => {
    const groups = buildSwitcherGroups(regions as never, 'ar')
    expect(groups.map((g) => g.label)).toEqual(['دولي', 'تونس'])
    expect(groups[1]!.options.map((o) => o.label)).toEqual(['تونس — العربية (تونس)', 'تونس — English (Tunisia)'])
    expect(buildSwitcherGroups(regions as never, 'ar-TN')[0]!.label).toBe('دولي')
  })

  it('swaps the locale prefix of the current URL', () => {
    expect(swapLocaleInPath('/ar/about-us/team', 'ar-TN')).toBe('/ar-TN/about-us/team')
    expect(swapLocaleInPath('/en', 'ar')).toBe('/ar')
  })
})

describe('Intl formatting by region', () => {
  const tn = { code: 'tn', currency: 'TND', numberFormat: 'arab' as const, dateFormat: 'long' as const, timezone: 'Africa/Tunis' }
  const intl = { code: 'intl', currency: 'USD', numberFormat: 'latn' as const, dateFormat: 'medium' as const, timezone: 'UTC' }

  it('uses Arabic-Indic digits and the region currency when configured', () => {
    expect(formatNumber(1250, { locale: 'ar-TN', region: tn })).toBe('١٬٢٥٠')
    expect(formatNumber(30, { locale: 'ar-TN', region: tn, style: 'currency' })).toMatch(/د\.ت/)
    expect(formatNumber(30, { locale: 'ar-TN', region: tn, style: 'currency' })).toMatch(/[٠-٩]/)
  })

  it('uses Latin digits and USD for the international region', () => {
    expect(formatNumber(1250, { locale: 'ar', region: intl })).toBe('1,250')
    expect(formatNumber(30, { locale: 'en', region: intl, style: 'currency' })).toBe('$30')
    expect(formatNumber(12500, { locale: 'en', region: intl, style: 'compact' })).toBe('12.5K')
    expect(formatNumber(42, { locale: 'en', region: intl, style: 'percent' })).toBe('42%')
  })

  it('formats dates in the region time zone and style', () => {
    expect(formatDate('2026-10-29T23:30:00Z', { locale: 'en', region: intl })).toBe('Oct 29, 2026')
    // 23:30 UTC is already 30 October in Tunis (UTC+1)
    expect(formatDate('2026-10-29T23:30:00Z', { locale: 'en-TN', region: { ...tn, numberFormat: 'latn' } })).toMatch(/October 30|30 October/)
    expect(formatDate('2026-10-29T23:30:00Z', { locale: 'ar-TN', region: tn })).toContain('٣٠')
  })
})
