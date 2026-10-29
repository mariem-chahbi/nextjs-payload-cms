import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'

import styles from './admin.module.css'
import { pick } from './shared'
import { TranslationProgress } from './TranslationDashboard'

/** /admin/translation-progress — the full translation report (the dashboard shows a one-line summary). */
export async function TranslationProgressView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const { payload, user, i18n } = req
  if (!user) redirect('/admin/login')
  const lang = i18n.language
  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      <div className={`gutter--left gutter--right ${styles.page}`}>
        <header className={styles.header}>
          <h1>{pick(lang, 'Translation progress', 'تقدم الترجمة')}</h1>
        </header>
        <TranslationProgress
          payload={payload}
          lang={lang}
          fresh={searchParams?.refresh === '1'}
          refreshHref="/admin/translation-progress?refresh=1"
        />
      </div>
    </DefaultTemplate>
  )
}
