'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useId } from 'react'

import { REGION_COOKIE } from '@/utilities/getLocale'

export type SwitcherOption = { value: string; regionCode: string; locale: string; label: string }
export type SwitcherGroup = { regionCode: string; label: string; options: SwitcherOption[] }

/** Replaces the locale prefix of the current path: /ar/about → /ar-TN/about. */
export const swapLocaleInPath = (pathname: string, locale: string): string => {
  const [, , ...rest] = pathname.split('/')
  return `/${[locale, ...rest].filter(Boolean).join('/')}`
}

/** One control for both: pick a region and one of its languages (e.g. Tunisia — العربية). */
export function RegionLanguageSwitcher({ groups, current, label }: { groups: SwitcherGroup[]; current: string; label: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const id = useId()

  return (
    <div className="switcher">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span aria-hidden className="switcher-icon">
        🌐
      </span>
      <select
        id={id}
        value={current}
        onChange={(event) => {
          const option = groups.flatMap((g) => g.options).find((o) => o.value === event.target.value)
          if (!option) return
          document.cookie = `${REGION_COOKIE}=${encodeURIComponent(option.regionCode)}; path=/; max-age=31536000; samesite=lax`
          router.push(swapLocaleInPath(pathname, option.locale))
          router.refresh()
        }}
      >
        {groups.map((group) => (
          <optgroup key={group.regionCode} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value} lang={option.locale}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
