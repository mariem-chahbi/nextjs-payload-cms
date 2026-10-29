import type { LocaleCode } from '@/i18n/locales'
import type { Region } from '@/payload-types'

/** Passed from the page to every block component. Plain data only (safe for client components). */
export type RenderContext = {
  locale: LocaleCode
  dir: 'rtl' | 'ltr'
  region?: Region
  homePageId?: number | string | null
  /** UI strings of the "common" namespace, already resolved along the fallback chain. */
  strings: Record<string, string>
}

export const tr = (ctx: Pick<RenderContext, 'strings'>, key: string, fallback: string) => ctx.strings[key] ?? fallback
