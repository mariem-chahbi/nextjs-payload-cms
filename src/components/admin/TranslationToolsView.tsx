import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'

import { isContentManager } from '@/access/roles'

import styles from './admin.module.css'
import { pick } from './shared'
import { TranslationToolsClient } from './TranslationToolsClient'

/** /admin/translation-tools — export a locale (CSV with BOM / XLSX / JSON) and import it back. */
export async function TranslationToolsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
          <h1>{pick(lang, 'Import / export translations', 'استيراد / تصدير الترجمات')}</h1>
        </header>
        <TranslationToolsClient lang={lang} canPublish={isContentManager(user as never)} />
      </div>
    </DefaultTemplate>
  )
}
