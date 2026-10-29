import { NextResponse, type NextRequest } from 'next/server'

import { isLocale } from '@/i18n/locales'
import { LOCALE_COOKIE, LOCALE_HEADER, negotiateLocale, ONE_YEAR } from '@/utilities/getLocale'

/**
 * Locale routing for site pages only.
 *  - /ar-TN/...  → served as is; the choice is remembered in a cookie.
 *  - /about      → redirected to /<locale>/about, from the cookie or Accept-Language (first visit).
 * Never runs for /admin, /api, /next/*, /_next/*, the favicon, or any file with an extension.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const firstSegment = pathname.split('/')[1]

  if (isLocale(firstSegment)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(LOCALE_HEADER, firstSegment)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
      response.cookies.set(LOCALE_COOKIE, firstSegment, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' })
    }
    return response
  }

  const locale = negotiateLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get('accept-language'),
  })
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  url.search = search
  const response = NextResponse.redirect(url)
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' })
  return response
}

export const config = {
  // Skip: admin, api, next (preview routes), _next, favicon, and anything with a file extension.
  matcher: ['/((?!admin(?:/|$)|api(?:/|$)|next(?:/|$)|_next(?:/|$)|favicon\\.ico$|.*\\.\\w+$).*)'],
}
