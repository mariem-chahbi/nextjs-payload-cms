import { headers } from 'next/headers'
import type { ServerProps } from 'payload'

import { isContentManager, isTranslator } from '@/access/roles'

import { SiteOverview } from './SiteOverview'
import { TranslationProgress, TranslationSummary } from './TranslationDashboard'

export type DashboardSection = 'overview' | 'translation-summary' | 'translation-progress'

/** Content first; translators (whose job is translating) get the full translation report first. */
export const dashboardSections = (user: { role?: string | null } | null | undefined): DashboardSection[] =>
  isTranslator(user as never) ? ['translation-progress', 'overview'] : ['overview', 'translation-summary']

/** Admin home (beforeDashboard), above Payload's collection cards. ?refresh=1 recalculates everything now. */
export async function Dashboard({ payload, user: userProp, i18n, searchParams }: ServerProps) {
  if (!payload) return null
  // The dashboard does not always pass `user` to beforeDashboard: read it from the request cookies.
  const user = userProp ?? (await payload.auth({ headers: await headers() })).user
  if (!user) return null
  const lang = i18n?.language
  const fresh = searchParams?.refresh === '1'
  const refreshHref = '/admin?refresh=1'

  return (
    <>
      {dashboardSections(user as never).map((section) => {
        switch (section) {
          case 'overview':
            return (
              <SiteOverview
                key={section}
                payload={payload}
                lang={lang}
                canEdit={isContentManager(user as never)}
                fresh={fresh}
                refreshHref={refreshHref}
              />
            )
          case 'translation-progress':
            return <TranslationProgress key={section} payload={payload} lang={lang} fresh={fresh} refreshHref={refreshHref} />
          case 'translation-summary':
            return <TranslationSummary key={section} payload={payload} lang={lang} />
        }
      })}
    </>
  )
}
