import { headers } from 'next/headers'
import Link from 'next/link'

import { RichText } from '@/components/site/RichText'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales'
import { getGlobal } from '@/utilities/data'
import { LOCALE_HEADER } from '@/utilities/getLocale'

/** 404 inside a locale. Title, message and button come from Site settings → 404 page. */
export default async function NotFound() {
  const fromProxy = (await headers()).get(LOCALE_HEADER)
  const locale = isLocale(fromProxy) ? fromProxy : DEFAULT_LOCALE
  const settings = await getGlobal('site-settings', locale)
  const content = settings.notFound

  return (
    <section className="block not-found">
      <div className="block-inner container container-narrow">
        <p className="not-found-code" aria-hidden>
          404
        </p>
        <h1>{content?.title || 'Page not found'}</h1>
        <RichText data={content?.content} locale={locale} />
        <p>
          <Link href={`/${locale}`} className="btn btn-primary btn-md">
            {content?.buttonLabel || 'Home'}
          </Link>
        </p>
      </div>
    </section>
  )
}
