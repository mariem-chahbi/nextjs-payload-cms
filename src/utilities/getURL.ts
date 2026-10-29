const DEFAULT_URL = 'http://localhost:3000'

const trimSlash = (url: string) => url.replace(/\/+$/, '')

/** Absolute base URL for server code (metadata, sitemap, emails, preview links). */
export const getServerSideURL = (): string =>
  trimSlash(process.env.NEXT_PUBLIC_SERVER_URL || DEFAULT_URL)

/** Base URL in the browser: the current origin, falling back to the configured URL. */
export const getClientSideURL = (): string => {
  if (typeof window !== 'undefined') return window.location.origin
  return getServerSideURL()
}

/** Joins the base URL and a path without doubling slashes. */
export const absoluteURL = (path: string, base: string = getServerSideURL()): string =>
  `${trimSlash(base)}/${path.replace(/^\/+/, '')}`
