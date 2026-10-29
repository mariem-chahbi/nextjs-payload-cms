import { absoluteURL } from './getURL'

/** URL that turns on draft mode and opens `path` (see app/(frontend)/next/preview). */
export const previewURL = (path: string): string => absoluteURL(`next/preview?path=${encodeURIComponent(path)}`)

/** Site path of a page document in a locale (the home page is just /<locale>). */
export const sitePathFor = (locale: string, doc?: { path?: string | null } | null): string =>
  doc?.path ? `/${locale}/${doc.path}` : `/${locale}`
