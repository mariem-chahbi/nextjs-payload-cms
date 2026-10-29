import { resolveWithFallback } from '@/i18n/fallback'
import { getLocaleDefinition, isLocale, type LocaleCode } from '@/i18n/locales'
import { activeRegions, type RegionLike } from '@/i18n/regions'

import type { SwitcherGroup } from './RegionLanguageSwitcher'

type RegionWithNames = Omit<RegionLike, 'name'> & { name?: string | Record<string, string | null> | null }

/** Switcher groups from active regions: region names in the current locale, languages in their own script. */
export const buildSwitcherGroups = (regions: RegionWithNames[], locale: LocaleCode): SwitcherGroup[] =>
  activeRegions(regions as RegionLike[]).map((region) => {
    const raw = (region as RegionWithNames).name
    const name = typeof raw === 'string' ? raw : (resolveWithFallback(raw ?? {}, locale).value ?? region.code)
    return {
      regionCode: region.code,
      label: name,
      options: (region.locales ?? []).filter(isLocale).map((code) => ({
        value: `${region.code}|${code}`,
        regionCode: region.code,
        locale: code,
        label: `${name} — ${getLocaleDefinition(code).nativeLabel}`,
      })),
    }
  })
